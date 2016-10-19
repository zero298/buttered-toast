/*jslint browser:true, devel:true, esversion:6*/
/*global angular*/

(function (ng) {
    "use strict";

    function config(hvToasterProvider) {
        hvToasterProvider.setHideTimeout(1000);
        hvToasterProvider.setFallbackFunction(() => console.log("I'm a fallback"));
    }

    function NotifyCtrl(hvToaster) {
        this.onBtnClick = function ($event) {
            hvToaster.notify({
                title: "Notification",
                body: "A test notification"
            }).then(function (toast) {
                console.log("Should be displayed");
            }).catch(console.error);
            $event.preventDefault();
        };
    }

    ng
        .module("notifyTest", ["hexvox.butteredToast"])
        .config(["hvToasterProvider", config])
        .controller("NotifyCtrl", ["hvToaster", NotifyCtrl]);
}(angular));
