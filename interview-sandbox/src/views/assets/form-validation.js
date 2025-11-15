/**
 * Form Validation Utilities
 * Reusable validation functions with animations
 */

(function() {
  'use strict';

  // Validation animations
  const validationStyles = `
    <style>
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      .shake {
        animation: shake 0.5s;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .slide-down {
        animation: slideDown 0.3s ease-out;
      }
    </style>
  `;

  // Inject styles if not already present
  if (!document.getElementById('form-validation-styles')) {
    const styleEl = document.createElement('div');
    styleEl.id = 'form-validation-styles';
    styleEl.innerHTML = validationStyles;
    document.head.appendChild(styleEl);
  }

  // Email validation
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Show error state
  function showError(input, errorElement, message) {
    input.style.borderColor = 'var(--color-error)';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    errorElement.textContent = message;
    errorElement.style.opacity = '1';
    errorElement.style.transform = 'translateY(0)';
    errorElement.classList.add('slide-down');
    input.classList.add('shake');
    setTimeout(function() {
      input.classList.remove('shake');
    }, 500);
  }

  // Show success state
  function showSuccess(input, iconElement) {
    input.style.borderColor = 'var(--color-success)';
    input.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
    iconElement.style.opacity = '1';
    iconElement.style.transform = 'scale(1)';
  }

  // Clear validation state
  function clearValidation(input, errorElement, iconElement) {
    input.style.borderColor = 'var(--border-medium)';
    input.style.boxShadow = 'none';
    errorElement.style.opacity = '0';
    errorElement.style.transform = 'translateY(-10px)';
    iconElement.style.opacity = '0';
  }

  // Setup email validation
  function setupEmailValidation(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const errorElement = document.getElementById(inputId + 'Error');
    const iconElement = document.getElementById(inputId + 'Icon');

    input.addEventListener('input', function() {
      const email = this.value.trim();
      if (email.length === 0) {
        clearValidation(this, errorElement, iconElement);
      } else if (!validateEmail(email)) {
        showError(this, errorElement, 'Please enter a valid email address');
        iconElement.style.opacity = '0';
      } else {
        showSuccess(this, iconElement);
        errorElement.style.opacity = '0';
        errorElement.style.transform = 'translateY(-10px)';
      }
    });

    input.addEventListener('focus', function() {
      this.style.borderColor = 'var(--color-primary-500)';
      this.style.boxShadow = '0 0 0 3px var(--color-primary-100)';
    });

    input.addEventListener('blur', function() {
      const email = this.value.trim();
      if (email.length === 0) {
        this.style.borderColor = 'var(--border-medium)';
        this.style.boxShadow = 'none';
      } else if (!validateEmail(email)) {
        this.style.borderColor = 'var(--color-error)';
        this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
      }
    });
  }

  // Setup password validation
  function setupPasswordValidation(inputId, minLength) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const errorElement = document.getElementById(inputId + 'Error');
    const iconElement = document.getElementById(inputId + 'Icon');
    minLength = minLength || 6;

    input.addEventListener('input', function() {
      const password = this.value;
      if (password.length === 0) {
        clearValidation(this, errorElement, iconElement);
      } else if (password.length < minLength) {
        showError(this, errorElement, 'Password must be at least ' + minLength + ' characters');
        iconElement.style.opacity = '0';
      } else {
        showSuccess(this, iconElement);
        errorElement.style.opacity = '0';
        errorElement.style.transform = 'translateY(-10px)';
      }
    });

    input.addEventListener('focus', function() {
      this.style.borderColor = 'var(--color-primary-500)';
      this.style.boxShadow = '0 0 0 3px var(--color-primary-100)';
    });

    input.addEventListener('blur', function() {
      const password = this.value;
      if (password.length === 0) {
        this.style.borderColor = 'var(--border-medium)';
        this.style.boxShadow = 'none';
      } else if (password.length < minLength) {
        this.style.borderColor = 'var(--color-error)';
        this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
      }
    });
  }

  // Setup name validation
  function setupNameValidation(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const errorElement = document.getElementById(inputId + 'Error');
    const iconElement = document.getElementById(inputId + 'Icon');

    input.addEventListener('input', function() {
      const name = this.value.trim();
      if (name.length === 0) {
        clearValidation(this, errorElement, iconElement);
      } else if (name.length < 2) {
        showError(this, errorElement, 'Name must be at least 2 characters');
        iconElement.style.opacity = '0';
      } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        showError(this, errorElement, 'Name can only contain letters and spaces');
        iconElement.style.opacity = '0';
      } else {
        showSuccess(this, iconElement);
        errorElement.style.opacity = '0';
        errorElement.style.transform = 'translateY(-10px)';
      }
    });

    input.addEventListener('focus', function() {
      this.style.borderColor = 'var(--color-primary-500)';
      this.style.boxShadow = '0 0 0 3px var(--color-primary-100)';
    });
  }

  // Expose functions globally
  window.FormValidation = {
    validateEmail: validateEmail,
    showError: showError,
    showSuccess: showSuccess,
    clearValidation: clearValidation,
    setupEmailValidation: setupEmailValidation,
    setupPasswordValidation: setupPasswordValidation,
    setupNameValidation: setupNameValidation
  };
})();

