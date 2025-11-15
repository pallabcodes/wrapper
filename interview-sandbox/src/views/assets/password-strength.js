/**
 * Password Strength Indicator
 */
(function() {
  'use strict';

  function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  }

  function updatePasswordStrength(passwordId) {
    const input = document.getElementById(passwordId);
    if (!input) return;

    const strengthBars = ['strengthBar1', 'strengthBar2', 'strengthBar3', 'strengthBar4'];
    const strengthText = document.getElementById('strengthText');
    
    input.addEventListener('input', function() {
      const password = this.value;
      const strength = calculatePasswordStrength(password);
      const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      const strengthColors = [
        'var(--color-error)',
        'var(--color-error)',
        'var(--color-warning)',
        'var(--color-primary-600)',
        'var(--color-success)'
      ];
      
      strengthBars.forEach(function(barId, index) {
        const bar = document.getElementById(barId);
        if (bar) {
          if (index < strength) {
            bar.style.backgroundColor = strengthColors[strength - 1];
            bar.style.transform = 'scaleY(1.2)';
          } else {
            bar.style.backgroundColor = 'var(--border-light)';
            bar.style.transform = 'scaleY(1)';
          }
        }
      });
      
      if (strengthText) {
        if (password.length > 0) {
          strengthText.textContent = strengthLabels[strength] || '';
          strengthText.style.color = strengthColors[strength - 1] || 'var(--text-tertiary)';
        } else {
          strengthText.textContent = '';
        }
      }
    });
  }

  window.PasswordStrength = {
    init: updatePasswordStrength,
    calculate: calculatePasswordStrength
  };
})();

