# Reusable Components

This directory contains reusable EJS components for consistent UI/UX across all templates.

## Available Components

### 1. Input Component (`input.ejs`)

A fully-featured input component with validation, icons, and error handling.

**Usage:**
```ejs
<%- include('../components/input', {
  id: 'email',
  name: 'email',
  type: 'email',
  label: 'Email Address',
  placeholder: 'Enter your email',
  value: '',
  required: true,
  icon: 'fas fa-envelope',
  error: '',
  helperText: 'We'll never share your email',
  disabled: false,
  size: 'base' // 'sm', 'base', 'lg'
}) %>
```

**Props:**
- `id` (string): Input ID
- `name` (string): Input name attribute
- `type` (string): Input type (text, email, password, etc.)
- `label` (string): Label text
- `placeholder` (string): Placeholder text
- `value` (string): Initial value
- `required` (boolean): Required field
- `icon` (string): Font Awesome icon class
- `error` (string): Error message to display
- `helperText` (string): Helper text below input
- `disabled` (boolean): Disable input
- `readonly` (boolean): Read-only input
- `minlength` (number): Minimum length
- `maxlength` (number): Maximum length
- `pattern` (string): Validation pattern
- `autocomplete` (string): Autocomplete attribute
- `size` (string): Size variant ('sm', 'base', 'lg')

---

### 2. Button Component (`button.ejs`)

A versatile button component with multiple variants and states.

**Usage:**
```ejs
<%- include('../components/button', {
  type: 'submit',
  variant: 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger', 'success'
  size: 'base', // 'sm', 'base', 'lg'
  fullWidth: false,
  disabled: false,
  loading: false,
  icon: 'fas fa-save',
  iconPosition: 'left', // 'left', 'right'
  content: 'Save'
}) %>
```

**Props:**
- `type` (string): Button type ('button', 'submit', 'reset')
- `variant` (string): Style variant
- `size` (string): Size variant
- `fullWidth` (boolean): Full width button
- `disabled` (boolean): Disable button
- `loading` (boolean): Show loading state
- `icon` (string): Font Awesome icon class
- `iconPosition` (string): Icon position
- `content` (string): Button text
- `id` (string): Button ID
- `className` (string): Additional CSS classes
- `onclick` (string): Click handler

---

### 3. Card Component (`card.ejs`)

A flexible card container component.

**Usage:**
```ejs
<%- include('../components/card', {
  title: 'Card Title',
  subtitle: 'Card Subtitle',
  icon: 'fas fa-user',
  footer: '<button>Action</button>',
  padding: 'base', // 'none', 'sm', 'base', 'lg'
  shadow: 'md', // 'none', 'sm', 'md', 'lg'
  bordered: true,
  content: '<p>Card content</p>'
}) %>
```

**Props:**
- `title` (string): Card title
- `subtitle` (string): Card subtitle
- `icon` (string): Font Awesome icon class
- `footer` (string): Footer HTML content
- `padding` (string): Padding variant
- `shadow` (string): Shadow variant
- `bordered` (boolean): Show border
- `content` (string): Main content HTML
- `className` (string): Additional CSS classes

---

### 4. Alert Component (`alert.ejs`)

A notification/alert component for displaying messages.

**Usage:**
```ejs
<%- include('../components/alert', {
  type: 'success', // 'success', 'error', 'warning', 'info'
  title: 'Success!',
  message: 'Operation completed successfully',
  dismissible: true,
  id: 'alert-1'
}) %>
```

**Props:**
- `type` (string): Alert type
- `title` (string): Alert title (optional)
- `message` (string): Alert message
- `dismissible` (boolean): Show dismiss button
- `id` (string): Alert ID (auto-generated if not provided)

**Note:** Alerts auto-dismiss after 5 seconds if `dismissible` is true.

---

### 5. Modal Component (`modal.ejs`)

An improved modal dialog component.

**Usage:**
```ejs
<%- include('../components/modal', {
  id: 'exampleModal',
  title: 'Example Modal',
  subtitle: 'Optional subtitle',
  icon: 'fas fa-info-circle',
  body: '<p>Modal content</p>',
  footer: '<button onclick="closeModal(\'exampleModal\')">Close</button>',
  size: 'md', // 'sm', 'md', 'lg', 'xl', '2xl', 'full'
  closable: true
}) %>

<!-- To open: -->
<button onclick="openModal('exampleModal')">Open Modal</button>
```

**Props:**
- `id` (string): Modal ID (required)
- `title` (string): Modal title
- `subtitle` (string): Modal subtitle
- `icon` (string): Font Awesome icon class
- `body` (string): Modal body HTML
- `footer` (string): Modal footer HTML
- `size` (string): Modal size variant
- `closable` (boolean): Show close button

**Functions:**
- `openModal(modalId)`: Open the modal
- `closeModal(modalId)`: Close the modal

**Features:**
- Click outside to close
- Escape key to close
- Backdrop blur effect
- Smooth animations

---

### 6. Table Component (`table.ejs`)

An improved table component with design system integration.

**Usage:**
```ejs
<%- include('../components/table', {
  headers: ['Name', 'Email', 'Role'],
  data: [
    { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
  ],
  columns: ['name', 'email', 'role'],
  striped: true,
  hover: true,
  bordered: false,
  emptyMessage: 'No data available',
  compact: false
}) %>
```

**Props:**
- `headers` (array): Table header labels
- `data` (array): Array of row objects
- `columns` (array): Column keys to display
- `striped` (boolean): Alternating row colors
- `hover` (boolean): Hover effect on rows
- `bordered` (boolean): Show cell borders
- `emptyMessage` (string): Message when no data
- `compact` (boolean): Compact spacing

---

## Design System Integration

All components use design tokens from `design-system.css`:
- Colors: `var(--color-primary-*)`, `var(--text-*)`, `var(--bg-*)`
- Spacing: `var(--spacing-*)`
- Typography: `var(--font-*)`
- Shadows: `var(--shadow-*)`
- Borders: `var(--border-*)`
- Transitions: `var(--transition-*)`

## Best Practices

1. **Always use components** instead of raw HTML for consistency
2. **Pass props explicitly** - don't rely on defaults unless intentional
3. **Use design tokens** - avoid hardcoded colors/sizes
4. **Test in both themes** - ensure components work in light/dark mode
5. **Accessibility** - components include ARIA labels and keyboard navigation

## Examples

See the auth templates (`auth/login.ejs`, `auth/signup.ejs`, etc.) for complete examples of component usage.

