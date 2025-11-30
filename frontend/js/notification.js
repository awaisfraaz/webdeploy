document.addEventListener('DOMContentLoaded', () => {
    // Mark all as read functionality
    const markReadBtn = document.querySelector('.mark-read-btn');
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');

    markReadBtn.addEventListener('click', () => {
        unreadNotifications.forEach(notification => {
            notification.classList.remove('unread');
            const statusDot = notification.querySelector('.notif-status');
            if (statusDot) {
                statusDot.remove();
            }
        });
    });

    // Individual notification click to mark as read
    const notifications = document.querySelectorAll('.notification-item');
    notifications.forEach(notification => {
        notification.addEventListener('click', () => {
            if (notification.classList.contains('unread')) {
                notification.classList.remove('unread');
                const statusDot = notification.querySelector('.notif-status');
                if (statusDot) {
                    statusDot.remove();
                }
            }
        });
    });

    // Friend request buttons (visual only)
    const confirmBtns = document.querySelectorAll('.confirm-btn');
    const deleteBtns = document.querySelectorAll('.delete-btn');

    confirmBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering notification click
            btn.parentElement.innerHTML = '<span style="color: #65676b;">Request accepted</span>';
        });
    });

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            btn.parentElement.innerHTML = '<span style="color: #65676b;">Request removed</span>';
        });
    });
});