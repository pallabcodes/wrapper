/**
 * Realtime Features JavaScript
 */
(function() {
  'use strict';

  let socket = null;
  let messageCount = 0;
  let notificationCount = 0;
  let connectionCount = 0;
  let latencyStartTime = null;

  function initSocket() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      updateStatus('disconnected', 'Authentication required');
      return;
    }

    socket = io('http://localhost:3000/notifications', {
      auth: { token: token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', function() {
      updateStatus('connected', 'Connected');
      connectionCount++;
      updateConnectionsCount();
      startLatencyCheck();
    });

    socket.on('disconnect', function() {
      updateStatus('disconnected', 'Disconnected');
      connectionCount = Math.max(0, connectionCount - 1);
      updateConnectionsCount();
    });

    socket.on('connect_error', function(error) {
      updateStatus('error', 'Connection error');
      console.error('Socket connection error:', error);
    });

    socket.on('notification', function(data) {
      addNotification(data);
      notificationCount++;
      updateNotificationsCount();
    });

    socket.on('chat-message', function(data) {
      addChatMessage(data);
      messageCount++;
      updateMessagesCount();
    });
  }

  function updateStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    if (!indicator || !statusText) return;
    
    statusText.textContent = text;
    if (status === 'connected') {
      indicator.style.backgroundColor = '#28a745';
    } else if (status === 'disconnected') {
      indicator.style.backgroundColor = '#6c757d';
    } else if (status === 'error') {
      indicator.style.backgroundColor = '#dc3545';
    }
  }

  window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !socket || !socket.connected) return;
    
    const messageData = {
      message: message,
      timestamp: Date.now(),
      userId: 'current-user'
    };
    
    socket.emit('chat-message', messageData);
    addChatMessage({ ...messageData, username: 'You', isOwn: true });
    messageCount++;
    updateMessagesCount();
    input.value = '';
  };

  function addChatMessage(data) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    if (messagesContainer.querySelector('.text-center')) {
      messagesContainer.innerHTML = '';
    }
    
    const messageDiv = document.createElement('div');
    const isOwn = data.isOwn || false;
    messageDiv.className = 'd-flex align-items-start gap-2 mb-3' + (isOwn ? ' flex-row-reverse' : '');
    messageDiv.style.maxWidth = '80%';
    messageDiv.style.marginLeft = isOwn ? 'auto' : '0';
    
    const username = escapeHtml(data.username || 'User');
    const messageText = escapeHtml(data.message);
    const timeText = formatTime(data.timestamp);
    
    messageDiv.innerHTML = 
      '<div class="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle" style="width: 2rem; height: 2rem; background-color: var(--color-primary-50);">' +
        '<i class="fas fa-user small" style="color: var(--color-primary-600);"></i>' +
      '</div>' +
      '<div class="flex-grow-1">' +
        '<div class="d-flex align-items-center gap-2 mb-1">' +
          '<span class="small fw-semibold" style="color: var(--text-primary);">' + username + '</span>' +
          '<span class="small" style="color: var(--text-tertiary);">' + timeText + '</span>' +
        '</div>' +
        '<div class="px-3 py-2 rounded-3" style="background-color: var(--bg-secondary);">' +
          '<p class="small mb-0" style="color: var(--text-primary);">' + messageText + '</p>' +
        '</div>' +
      '</div>';
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addNotification(data) {
    const notificationsContainer = document.getElementById('notificationsList');
    if (!notificationsContainer) return;
    
    if (notificationsContainer.querySelector('.text-center')) {
      notificationsContainer.innerHTML = '';
    }
    
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'd-flex align-items-start gap-3 p-3 rounded-3 border mb-2';
    notificationDiv.style.cssText = 'background-color: var(--bg-secondary); border-color: var(--border-light) !important;';
    
    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    const colorMap = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    
    const type = data.type || 'info';
    const icon = iconMap[type] || iconMap.info;
    const color = colorMap[type] || colorMap.info;
    const title = escapeHtml(data.title || 'Notification');
    const message = escapeHtml(data.message || '');
    const time = formatTime(data.timestamp || Date.now());
    
    notificationDiv.innerHTML = 
      '<div class="flex-shrink-0">' +
        '<i class="fas ' + icon + '" style="color: ' + color + '; font-size: 1.125rem;"></i>' +
      '</div>' +
      '<div class="flex-grow-1">' +
        '<p class="small fw-semibold mb-1" style="color: var(--text-primary);">' + title + '</p>' +
        '<p class="small mb-2" style="color: var(--text-secondary);">' + message + '</p>' +
        '<p class="small mb-0" style="color: var(--text-tertiary);">' + time + '</p>' +
      '</div>' +
      '<button class="flex-shrink-0 btn btn-sm p-0 border-0" type="button" data-dismiss-notification="" style="opacity: 0.7; background: transparent;" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'0.7\'">' +
        '<i class="fas fa-times small" style="color: var(--text-tertiary);"></i>' +
      '</button>';
    
    notificationsContainer.insertBefore(notificationDiv, notificationsContainer.firstChild);
    
    const dismissBtn = notificationDiv.querySelector('[data-dismiss-notification]');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function() {
        notificationDiv.remove();
        if (notificationsContainer.children.length === 0) {
          notificationsContainer.innerHTML = '<div class="text-center py-5"><i class="fas fa-bell-slash fa-3x mb-3" style="color: var(--text-tertiary);"></i><p class="small mb-0" style="color: var(--text-secondary);">No notifications yet</p></div>';
        }
      });
    }
    
    setTimeout(function() {
      notificationDiv.remove();
      if (notificationsContainer.children.length === 0) {
        notificationsContainer.innerHTML = '<div class="text-center py-5"><i class="fas fa-bell-slash fa-3x mb-3" style="color: var(--text-tertiary);"></i><p class="small mb-0" style="color: var(--text-secondary);">No notifications yet</p></div>';
      }
    }, 5000);
  }

  window.clearNotifications = function() {
    const notificationsContainer = document.getElementById('notificationsList');
    if (notificationsContainer) {
      notificationsContainer.innerHTML = '<div class="text-center py-5"><i class="fas fa-bell-slash fa-3x mb-3" style="color: var(--text-tertiary);"></i><p class="small mb-0" style="color: var(--text-secondary);">No notifications yet</p></div>';
      notificationCount = 0;
      updateNotificationsCount();
    }
  };

  function updateConnectionsCount() {
    const el = document.getElementById('connectionsCount');
    if (el) el.textContent = connectionCount;
  }

  function updateMessagesCount() {
    const el = document.getElementById('messagesCount');
    if (el) el.textContent = messageCount;
  }

  function updateNotificationsCount() {
    const el = document.getElementById('notificationsCount');
    if (el) el.textContent = notificationCount;
  }

  function startLatencyCheck() {
    setInterval(function() {
      if (socket && socket.connected) {
        latencyStartTime = Date.now();
        socket.emit('ping');
      }
    }, 5000);
    
    socket.on('pong', function() {
      if (latencyStartTime) {
        const latency = Date.now() - latencyStartTime;
        const el = document.getElementById('latencyValue');
        if (el) el.textContent = latency + ' ms';
        latencyStartTime = null;
      }
    });
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + 'm ago';
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocket);
  } else {
    initSocket();
  }

  setTimeout(function() {
    if (socket && socket.connected) {
      addNotification({
        type: 'success',
        title: 'Welcome!',
        message: 'You are now connected to the realtime system',
        timestamp: Date.now()
      });
    }
  }, 1000);
})();

