// Notification-related classes are defined by bulma.css temporarily

/**
 * add notification container to body
 */
const NotificationInit = () => {
    let container = `<div class="notification-container" 
                    style="z-index: 12;position: absolute;
                    width: 38.2%;max-width: 450px; 
                    min-width: 300px;left: 0;
                    bottom: 0;"></div>`
    $('body').append(container)
}

/**
 * return either primary/link/info/success/warning/danger kind of notify
 */
const Notify = (() => {
    // singleton for notification container
    let container = $('.notification-container')
    if (!container.length) {
        NotificationInit()
        container = $('.notification-container')
    }

    let NotifyFactory = (type, msg, secs) => {
        let id = new Date().getTime()
        let notification = `<div id="notify-${id}" class="notification is-${type}">
                                <button class="delete"></button>
                                ${msg}
                            </div>`
        container.append(notification)
        $('#notify-' + id + ' .delete').on('click', function () {
            $('#notify-' + id).remove()
        })
        setTimeout(function () {
            $('#notify-' + id).remove()
        }, secs)
    }

    return {
        primary (msg, secs) {
            NotifyFactory('primary', msg, secs)
        },
        link (msg, secs) {
            NotifyFactory('link', msg, secs)
        },
        info (msg, secs) {
            NotifyFactory('info', msg, secs)
        },
        success (msg, secs) {
            NotifyFactory('success', msg, secs)
        },
        warning (msg, secs) {
            NotifyFactory('warning', msg, secs)
        },
        danger (msg, secs) {
            NotifyFactory('danger', msg, secs)
        }
    }
})()

export default Notify