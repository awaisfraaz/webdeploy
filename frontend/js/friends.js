document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        alert('Please login first');
        window.location.href = '/';
        return;
    }

    loadAllFriends();
    loadFriendRequests();
    loadSuggestions();
    loadSentRequests();
});

function showSection(section) {
    // Hide all sections
    document.getElementById('allFriendsSection').style.display = 'none';
    document.getElementById('requestsSection').style.display = 'none';
    document.getElementById('suggestionsSection').style.display = 'none';
    document.getElementById('sentSection').style.display = 'none';

    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

    // Show selected section
    switch(section) {
        case 'all':
            document.getElementById('allFriendsSection').style.display = 'block';
            document.querySelectorAll('.menu-item')[0].classList.add('active');
            break;
        case 'requests':
            document.getElementById('requestsSection').style.display = 'block';
            document.querySelectorAll('.menu-item')[1].classList.add('active');
            break;
        case 'suggestions':
            document.getElementById('suggestionsSection').style.display = 'block';
            document.querySelectorAll('.menu-item')[2].classList.add('active');
            break;
        case 'sent':
            document.getElementById('sentSection').style.display = 'block';
            document.querySelectorAll('.menu-item')[3].classList.add('active');
            break;
    }
}

async function loadAllFriends() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/friends/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayFriends(data.friends);
            document.getElementById('friendCount').textContent = data.friends.length;
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

async function loadFriendRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/friends/requests/received', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayRequests(data.requests);
            document.getElementById('requestCount').textContent = data.requests.length;
        }
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

async function loadSuggestions() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/friends/suggestions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displaySuggestions(data.suggestions);
        }
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

async function loadSentRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/friends/requests/sent', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displaySentRequests(data.requests);
        }
    } catch (error) {
        console.error('Error loading sent requests:', error);
    }
}

function displayFriends(friends) {
    const list = document.getElementById('friendsList');
    
    if (friends.length === 0) {
        list.innerHTML = '<div class="no-items"><i class="material-icons">people_outline</i><p>No friends yet</p></div>';
        return;
    }

    list.innerHTML = friends.map(friend => `
        <div class="friend-card">
            <img src="${friend.profilePicture}" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${friend.firstname} ${friend.lastname}</div>
                <div class="friend-actions">
                    <button class="btn-secondary" onclick="unfriend('${friend._id}')">Unfriend</button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayRequests(requests) {
    const list = document.getElementById('requestsList');
    
    if (requests.length === 0) {
        list.innerHTML = '<div class="no-items"><i class="material-icons">person_add_disabled</i><p>No friend requests</p></div>';
        return;
    }

    list.innerHTML = requests.map(req => `
        <div class="friend-card">
            <img src="${req.requester.profilePicture}" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${req.requester.firstname} ${req.requester.lastname}</div>
                <div class="friend-actions">
                    <button class="btn-primary" onclick="acceptRequest('${req._id}')">Accept</button>
                    <button class="btn-secondary" onclick="rejectRequest('${req._id}')">Reject</button>
                </div>
            </div>
        </div>
    `).join('');
}

function displaySuggestions(suggestions) {
    const list = document.getElementById('suggestionsList');
    
    if (suggestions.length === 0) {
        list.innerHTML = '<div class="no-items"><i class="material-icons">group_add</i><p>No suggestions available</p></div>';
        return;
    }

    list.innerHTML = suggestions.map(user => `
        <div class="friend-card">
            <img src="${user.profilePicture}" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${user.firstname} ${user.lastname}</div>
                <div class="friend-actions">
                    <button class="btn-primary" onclick="sendRequest('${user._id}')">Add Friend</button>
                </div>
            </div>
        </div>
    `).join('');
}

function displaySentRequests(requests) {
    const list = document.getElementById('sentList');
    
    if (requests.length === 0) {
        list.innerHTML = '<div class="no-items"><i class="material-icons">send</i><p>No sent requests</p></div>';
        return;
    }

    list.innerHTML = requests.map(req => `
        <div class="friend-card">
            <img src="${req.recipient.profilePicture}" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">${req.recipient.firstname} ${req.recipient.lastname}</div>
                <div class="friend-actions">
                    <button class="btn-secondary" disabled>Pending</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function sendRequest(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/friends/request/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Friend request sent!');
            loadSuggestions();
            loadSentRequests();
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        console.error('Error sending request:', error);
    }
}

async function acceptRequest(friendshipId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/friends/accept/${friendshipId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Friend request accepted!');
            loadAllFriends();
            loadFriendRequests();
        }
    } catch (error) {
        console.error('Error accepting request:', error);
    }
}

async function rejectRequest(friendshipId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/friends/reject/${friendshipId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Friend request rejected');
            loadFriendRequests();
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
    }
}

async function unfriend(userId) {
    if (!confirm('Are you sure you want to unfriend this person?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/friends/unfriend/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Unfriended successfully');
            loadAllFriends();
        }
    } catch (error) {
        console.error('Error unfriending:', error);
    }
}
