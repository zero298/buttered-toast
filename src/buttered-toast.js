/*jslint browser:true, nomen:true, esversion:6*/
/*global angular, Notification*/

(function (ng) {
    "use strict";

    let $q,
        $timeout,
        $window,
        NOTIFICATION_PERMISSIONS;

    NOTIFICATION_PERMISSIONS = {
        DEFAULT: "default",
        GRANTED: "granted",
        DENIED: "denied"
    };

    function getPermission(callback) {
        if ($window.webkitNotifications && $window.webkitNotifications.checkPermission) {
            $window.webkitNotifications.requestPermission(callback);
        } else if ($window.Notification && $window.Notification.requestPermission) {
            $window.Notification.requestPermission(callback);
        }
    }

    function checkPermission() {
        let permission;
        if ($window.webkitNotifications && $window.webkitNotifications.checkPermission) {
            permission = NOTIFICATION_PERMISSIONS[$window.webkitNotifications.checkPermission()];
        } else if ($window.Notification && $window.Notification.permission) {
            permission = $window.Notification.permission;
        }
        return permission;
    }

    class Toast {
        constructor(kwargs) {
            if (typeof kwargs === "object") {
                this.title = kwargs.title || "";
                this.icon = kwargs.icon || "";
                this.body = kwargs.body || "";
                this.tag = kwargs.tag || "";
            } else if (typeof kwargs === "string") {
                this.title = kwargs;
            }
            this.toast = null;
        }
        show() {
            if (this.toast) {
                this.close();
            }
            if ($window.Notification) {
                this.toast = new $window.Notification(this.title, {
                    icon: this.icon,
                    body: this.body,
                    tag: this.tag
                });
            } else if ($window.webkitNotifications) {
                this.toast = $window.webkitNotifications.createNotification(
                    this.icon,
                    this.body
                );
            }
        }
        close() {
            if (this.toast) {
                this.toast.close();
                this.toast = null;
            }
        }
    }

    class Toaster {
        constructor(hideTimeout, fallbackFunction) {
            this.hideTimeout = hideTimeout;
            this.fallbackFunction = fallbackFunction;
        }
        displayNotification(toast) {
            toast.show();
            if (this.hideTimeout) {
                $timeout(() => toast.close(), this.hideTimeout);
            }
            return toast;
        }
        notify(kwargs) {
            return $q((resolve, reject) => {
                let permission = checkPermission(),
                    toast = new Toast(kwargs);

                switch (permission) {
                    case NOTIFICATION_PERMISSIONS.GRANTED:
                        resolve(this.displayNotification(toast));
                        break;
                    case NOTIFICATION_PERMISSIONS.DEFAULT:
                        getPermission(() => {
                            if (checkPermission() !== NOTIFICATION_PERMISSIONS.GRANTED) {
                                reject();
                            }
                            resolve(this.displayNotification(toast));
                        });
                        break;
                    case NOTIFICATION_PERMISSIONS.DENIED:
                        reject("Permission was denied");
                        break;
                    default:
                        reject(`Unknown permission: "${permission}"`);
                        break;
                }
            }).catch((err) => {
                if (this.fallbackFunction) {
                    return $q.resolve(this.fallbackFunction(kwargs));
                }
                return $q.reject("Cannot notify, need permission or fallback");
            });
        }
    }

    function ToasterProvider() {
        let hideTimeout = 0,
            fallbackFunction = null;

        this.setHideTimeout = function (value) {
            hideTimeout = value;
        };

        this.setFallbackFunction = function (fn) {
            fallbackFunction = fn;
        };

        function toasterGet(_$q_, _$timeout_, _$window_) {
            $q = _$q_;
            $timeout = _$timeout_;
            $window = _$window_;
            return new Toaster(hideTimeout, fallbackFunction);
        }

        toasterGet.$inject = [
            "$q",
            "$timeout",
            "$window"
        ];

        this.$get = toasterGet;
    }

    ng
        .module("hexvox.butteredToast", [])
        .provider("hvToaster", ToasterProvider);
}(angular));
