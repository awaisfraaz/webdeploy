let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        alert('Please login first');
        window.location.href = '/';
        return;
    }

    currentUser = user;
    await loadProfile();

    // Bio character counter
    const bioInput = document.getElementById('editBio');
    const bioCount = document.getElementById('bioCount');
    bioInput.addEventListener('input', () => {
        bioCount.textContent = bioInput.value.length;
    });
});

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/profile/me/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayProfile(data.user);
        } else {
            console.error('Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function displayProfile(user) {
    document.getElementById('userName').textContent = `${user.firstname} ${user.lastname}`;
    document.getElementById('userBio').textContent = user.bio || 'No bio yet';
    document.getElementById('profilePicture').src = user.profilePicture;
    
    // Set cover photo if exists
    if (user.coverPhoto) {
        document.getElementById('coverPhoto').style.backgroundImage = `url(${user.coverPhoto})`;
        document.getElementById('coverPhoto').style.backgroundSize = 'cover';
        document.getElementById('coverPhoto').style.backgroundPosition = 'center';
    }

    // Format join date
    const joinDate = new Date(user.createdAt);
    document.getElementById('memberSince').textContent = joinDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });

    // Update localStorage with latest user data
    localStorage.setItem('user', JSON.stringify({
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        profilePicture: user.profilePicture
    }));
}

function toggleEditMode() {
    const form = document.getElementById('editProfileForm');
    const isHidden = form.classList.contains('hidden');

    if (isHidden) {
        // Show form and populate with current values
        form.classList.remove('hidden');
        
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/profile/me/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            const user = data.user;
            document.getElementById('editFirstname').value = user.firstname;
            document.getElementById('editLastname').value = user.lastname;
            document.getElementById('editBio').value = user.bio || '';
            document.getElementById('editProfilePicture').value = user.profilePicture;
            document.getElementById('editCoverPhoto').value = user.coverPhoto || '';
            document.getElementById('bioCount').textContent = (user.bio || '').length;
        });
    } else {
        // Hide form
        form.classList.add('hidden');
    }
}

async function saveProfile() {
    const firstname = document.getElementById('editFirstname').value;
    const lastname = document.getElementById('editLastname').value;
    const bio = document.getElementById('editBio').value;
    const profilePicture = document.getElementById('editProfilePicture').value;
    const coverPhoto = document.getElementById('editCoverPhoto').value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/profile/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                firstname,
                lastname,
                bio,
                profilePicture,
                coverPhoto
            })
        });

        if (response.ok) {
            const data = await response.json();
            alert('Profile updated successfully!');
            displayProfile(data.user);
            toggleEditMode();
        } else {
            const error = await response.json();
            alert('Failed to update profile: ' + error.message);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile');
    }
}

function editProfilePicture() {
    const url = prompt('Enter profile picture URL:');
    if (url) {
        document.getElementById('editProfilePicture').value = url;
        toggleEditMode();
    }
}

function editCoverPhoto() {
    const url = prompt('Enter cover photo URL:');
    if (url) {
        document.getElementById('editCoverPhoto').value = url;
        toggleEditMode();
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}
