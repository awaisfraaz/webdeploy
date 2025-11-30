let selectedImage = null;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        alert('Please login first');
        window.location.href = '/';
        return;
    }

    // Display user info
    document.getElementById('userName').textContent = `${user.firstname} ${user.lastname}`;
    document.getElementById('userAvatar').src = user.profilePicture || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
    document.getElementById('postTextarea').placeholder = `What's on your mind, ${user.firstname}?`;

    // Enable/disable post button based on content
    const textarea = document.getElementById('postTextarea');
    const postBtn = document.getElementById('postBtn');

    textarea.addEventListener('input', () => {
        postBtn.disabled = textarea.value.trim() === '';
    });
});

function selectImage() {
    document.getElementById('imageInput').click();
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedImage = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').classList.add('show');
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    selectedImage = null;
    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreviewContainer').classList.remove('show');
}

async function createPost() {
    const content = document.getElementById('postTextarea').value.trim();
    
    if (!content) {
        alert('Please write something');
        return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('content', content);
    
    if (selectedImage) {
        formData.append('image', selectedImage);
    }

    try {
        document.getElementById('postBtn').disabled = true;
        document.getElementById('postBtn').textContent = 'Posting...';

        const response = await fetch('http://localhost:5000/api/posts/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            alert('Post created successfully!');
            window.location.href = '/home';
        } else {
            const error = await response.json();
            alert('Failed to create post: ' + error.message);
            document.getElementById('postBtn').disabled = false;
            document.getElementById('postBtn').textContent = 'Post';
        }
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Error creating post');
        document.getElementById('postBtn').disabled = false;
        document.getElementById('postBtn').textContent = 'Post';
    }
}
