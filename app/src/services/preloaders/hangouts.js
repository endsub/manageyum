require('./utils/spellcheck.js');
require('./utils/zoom.js');
const { ipcRenderer } = require('electron');


var notificationMap = {};

var service = null;
var globalNotification = true;

function getMessages() {
    var count = 0;
    var tempCount = document.getElementById("hangout-landing-chat").lastChild.contentWindow.document.body.getElementsByClassName("ee ").length;
	if(tempCount){
		count = tempCount;
	}    
    ipcRenderer['sendToHost']('notification-count', {
        count: count
    });
}


function initNotificationProxy() {

    var OldNotification = Notification;

    OldNotification.onclick = Notification.onclick;

    var settings = {
        forceSilent: false,
        bodyOverride: undefined
    };

    Notification = function(title, options) {

        if ((service === null || service.showNotifications) && globalNotification) {

            ipcRenderer.sendToHost('notification-message', {
                title: title,
                options: options
            });


            var notification;
            setTimeout(() => {

                var onclickOld = notification.onclick;
                notificationMap[title] = onclickOld;
                notification.onclick = function() {
                    ipcRenderer.sendToHost('notification-click', {});
                    console.log('notificationclicked')
                    if (onclickOld) onclickOld();
                };
            }, 1);

            // Apply overrides              // Apply overrides
            options = Object.assign({}, options);
            options = Object.assign({}, options);
            if (settings.forceSilent) options.silent = true;
            if (settings.forceSilent) options.silent = true;
            if (settings.bodyOverride) options.body = settings.bodyOverride;
            if (settings.bodyOverride) options.body = settings.bodyOverride;

            return notification = new OldNotification(title, options);
        }
    };


    Notification.prototype = OldNotification.prototype;
    Notification.permission = OldNotification.permission;
    Notification.requestPermission = OldNotification.requestPermission;

}

function initIpcListener() {
    ipcRenderer.on('open-notification', function(event, args) {
        console.log('am called')
        var notification = args;
        var onClickFn = notificationMap[notification.title]
        if (onClickFn) {
            console.log('inside notificationHandler')
            onClickFn();
            //notificationHandler();
        }
    });

    ipcRenderer.on('serviceUpdate', function(event, args) {
        service = args;
    });
    ipcRenderer.on('global-notification', function(event, args) {
        console.log("global-notification changed");
        globalNotification = args;
    });
}





hangouts = {
    init: function(serviceConfig) {
        service = JSON.parse(serviceConfig);
        setInterval(getMessages, 1000);
        initNotificationProxy();
        initIpcListener();
        console.log("hangouts preloader initialized");
    }
}
