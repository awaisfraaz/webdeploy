document.addEventListener('DOMContentLoaded', () => {
    // Like Button Functionality
    const likeBtn = document.getElementById('like-btn');
    likeBtn.addEventListener('click', () => {
        likeBtn.classList.toggle('active');
        const icon = likeBtn.querySelector('i');
        const text = likeBtn.querySelector('span');

        if (likeBtn.classList.contains('active')) {
            icon.textContent = 'thumb_up';
            icon.style.color = '#1877f2';
            text.style.color = '#1877f2';
        } else {
            icon.textContent = 'thumb_up_off_alt';
            icon.style.color = '';
            text.style.color = '';
        }
    });

    // Comment Functionality
    const commentInput = document.getElementById('comment-input');
    const commentList = document.getElementById('comment-list');

    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && commentInput.value.trim() !== '') {
            addComment(commentInput.value.trim());
            commentInput.value = '';
        }
    });

    function addComment(text) {
        const newComment = document.createElement('div');
        newComment.classList.add('comment');

        // Use a placeholder image for the new comment author
        const avatarUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

        newComment.innerHTML = `
            <img src="${avatarUrl}" class="comment-avatar-sm">
            <div class="comment-content-wrapper">
                <div class="comment-bubble">
                    <a href="#" class="comment-author">You</a>
                    <p class="comment-text">${escapeHtml(text)}</p>
                </div>
                <div class="comment-actions">
                    <span>Like</span>
                    <span>Reply</span>
                    <span>Just now</span>
                </div>
            </div>
        `;

        commentList.appendChild(newComment);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});