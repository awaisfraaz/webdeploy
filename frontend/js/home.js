document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        // Redirect to login if not authenticated
        alert('Please login first');
        window.location.href = '/';
        return;
    }

    // Display user name
    const userNameElements = document.querySelectorAll('.sidebar-item span');
    if (userNameElements.length > 0) {
        userNameElements[0].textContent = `${user.firstname} ${user.lastname}`;
    }

    // Update "What's on your mind" text
    const cpInput = document.querySelector('.cp-input');
    if (cpInput) {
        cpInput.textContent = `What's on your mind, ${user.firstname}?`;
    }

    // Load posts
    await loadPosts();
});

async function loadPosts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/posts/feed', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayPosts(data.posts);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function displayPosts(posts) {
    const feed = document.querySelector('.feed');
    
    // Remove old posts (keep stories and create widget)
    const oldPosts = feed.querySelectorAll('.post');
    oldPosts.forEach(post => post.remove());

    if (posts.length === 0) {
        const noPostsDiv = document.createElement('div');
        noPostsDiv.className = 'no-posts';
        noPostsDiv.innerHTML = '<p>No posts yet. Be the first to post!</p>';
        noPostsDiv.style.textAlign = 'center';
        noPostsDiv.style.padding = '40px';
        noPostsDiv.style.color = '#65676b';
        feed.appendChild(noPostsDiv);
        return;
    }

    posts.forEach(post => {
        const postElement = createPostElement(post);
        feed.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.dataset.postId = post._id;
    
    const timeAgo = getTimeAgo(new Date(post.createdAt));
    const imageUrl = post.image ? `http://localhost:5000${post.image}` : null;
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isLiked = post.likes.includes(currentUser.id);

    const isOwnPost = post.author._id === currentUser.id;

    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-header-left">
                <img src="${post.author.profilePicture}" class="post-avatar">
                <div class="post-info">
                    <span class="post-author">${post.author.firstname} ${post.author.lastname}</span>
                    <div class="post-time">
                        <span>${timeAgo}</span>
                        <span class="dot">·</span>
                        <i class="material-icons" style="font-size: 12px;">public</i>
                    </div>
                </div>
            </div>
            ${isOwnPost ? `
            <div class="post-options" onclick="togglePostMenu('${post._id}')">
                <i class="material-icons">more_horiz</i>
                <div class="post-menu" id="post-menu-${post._id}" style="display: none;">
                    <div class="post-menu-item" onclick="deletePost('${post._id}', event)">
                        <i class="material-icons">delete</i>
                        <span>Delete Post</span>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="post-content">
            <p>${post.content}</p>
        </div>
        ${imageUrl ? `<div class="post-media"><img src="${imageUrl}" alt="Post Image"></div>` : ''}
        <div class="post-stats">
            <div class="stats-left">
                <i class="material-icons like-icon-sm">thumb_up</i>
                <span class="like-count">${post.likes.length}</span>
            </div>
            <div class="stats-right">
                <span class="comment-count">${post.comments.length} Comments</span>
            </div>
        </div>
        <div class="post-actions-bar">
            <div class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post._id}')">
                <i class="material-icons">${isLiked ? 'thumb_up' : 'thumb_up_off_alt'}</i>
                <span>Like</span>
            </div>
            <div class="post-action-btn" onclick="toggleComments('${post._id}')">
                <i class="material-icons">chat_bubble_outline</i>
                <span>Comment</span>
            </div>
            <div class="post-action-btn">
                <i class="material-icons">share</i>
                <span>Share</span>
            </div>
        </div>
        <div class="comments-section" id="comments-${post._id}" style="display: none;">
            <div class="comment-input-container">
                <img src="${currentUser.profilePicture || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}" class="comment-avatar">
                <input type="text" class="comment-input" placeholder="Write a comment..." onkeypress="handleCommentKeyPress(event, '${post._id}')">
            </div>
            <div class="comments-list" id="comments-list-${post._id}">
                ${post.comments.map(comment => createCommentHTML(comment)).join('')}
            </div>
        </div>
    `;

    return postDiv;
}

function createCommentHTML(comment) {
    const timeAgo = getTimeAgo(new Date(comment.createdAt));
    return `
        <div class="comment-item">
            <img src="${comment.user.profilePicture}" class="comment-avatar">
            <div class="comment-content">
                <div class="comment-bubble">
                    <span class="comment-author">${comment.user.firstname} ${comment.user.lastname}</span>
                    <p class="comment-text">${comment.text}</p>
                </div>
                <div class="comment-actions">
                    <span class="comment-time">${timeAgo}</span>
                </div>
            </div>
        </div>
    `;
}

async function toggleLike(postId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            const likeBtn = postElement.querySelector('.like-btn');
            const likeCount = postElement.querySelector('.like-count');
            const likeIcon = likeBtn.querySelector('.material-icons');

            likeCount.textContent = data.likes;

            if (data.isLiked) {
                likeBtn.classList.add('liked');
                likeIcon.textContent = 'thumb_up';
            } else {
                likeBtn.classList.remove('liked');
                likeIcon.textContent = 'thumb_up_off_alt';
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        loadComments(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function loadComments(postId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const commentsList = document.getElementById(`comments-list-${postId}`);
            commentsList.innerHTML = data.comments.map(comment => createCommentHTML(comment)).join('');
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function handleCommentKeyPress(event, postId) {
    if (event.key === 'Enter') {
        const input = event.target;
        const text = input.value.trim();

        if (!text) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                input.value = '';
                await loadComments(postId);
                
                // Update comment count
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                const commentCount = postElement.querySelector('.comment-count');
                const currentCount = parseInt(commentCount.textContent);
                commentCount.textContent = `${currentCount + 1} Comments`;
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    }
}

function togglePostMenu(postId) {
    const menu = document.getElementById(`post-menu-${postId}`);
    const allMenus = document.querySelectorAll('.post-menu');
    
    // Close all other menus
    allMenus.forEach(m => {
        if (m.id !== `post-menu-${postId}`) {
            m.style.display = 'none';
        }
    });
    
    // Toggle current menu
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

async function deletePost(postId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Remove post from DOM
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            postElement.remove();
            alert('Post deleted successfully!');
        } else {
            const error = await response.json();
            alert('Failed to delete post: ' + error.message);
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
    }
}

// Close menus when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.post-options')) {
        const allMenus = document.querySelectorAll('.post-menu');
        allMenus.forEach(menu => menu.style.display = 'none');
    }
});

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';
    return Math.floor(seconds / 604800) + 'w';
}


// Notification functions
let notificationCheckInterval;

async function loadNotifications() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayNotifications(data.notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function checkUnreadCount() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const badge = document.getElementById('notificationBadge');
            if (data.count > 0) {
                badge.textContent = data.count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking unread count:', error);
    }
}

function displayNotifications(notifications) {
    const list = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="no-notifications">
                <i class="material-icons">notifications_none</i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(notif => {
        const timeAgo = getTimeAgo(new Date(notif.createdAt));
        let iconType, text, iconClass;

        switch(notif.type) {
            case 'like':
                iconType = 'thumb_up';
                iconClass = 'like';
                text = `<strong>${notif.sender.firstname} ${notif.sender.lastname}</strong> liked your post`;
                break;
            case 'comment':
                iconType = 'chat_bubble';
                iconClass = 'comment';
                text = `<strong>${notif.sender.firstname} ${notif.sender.lastname}</strong> commented: "${notif.commentText}"`;
                break;
            case 'friend_request':
                iconType = 'person_add';
                iconClass = 'friend-request';
                text = `<strong>${notif.sender.firstname} ${notif.sender.lastname}</strong> sent you a friend request`;
                break;
            case 'friend_accept':
                iconType = 'check_circle';
                iconClass = 'friend-accept';
                text = `<strong>${notif.sender.firstname} ${notif.sender.lastname}</strong> accepted your friend request`;
                break;
        }

        return `
            <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markAsRead('${notif._id}')">
                <div style="position: relative;">
                    <img src="${notif.sender.profilePicture}" class="notification-avatar">
                    <div class="notification-icon ${iconClass}">
                        <i class="material-icons">${iconType}</i>
                    </div>
                </div>
                <div class="notification-content">
                    <div class="notification-text">${text}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    const isVisible = dropdown.style.display === 'block';
    
    if (isVisible) {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
        loadNotifications();
    }
}

async function markAsRead(notificationId) {
    try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        await loadNotifications();
        await checkUnreadCount();
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

async function markAllAsRead() {
    try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5000/api/notifications/mark-all-read', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        await loadNotifications();
        await checkUnreadCount();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Check for new notifications every 10 seconds
notificationCheckInterval = setInterval(checkUnreadCount, 10000);

// Initial check
checkUnreadCount();

// Close notification dropdown when clicking outside
document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('notificationDropdown');
    const notificationBtn = document.querySelector('.notification-btn');
    
    if (!dropdown.contains(event.target) && !notificationBtn.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});
