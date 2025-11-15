# CRUD Template Guide

## Quick Start for Interview Tasks

This guide shows you how to quickly create CRUD pages for any entity (Students, Courses, Products, etc.) during your interview.

---

## 🚀 Ready-to-Use Components

### 1. **CRUD List Component** (`components/crud-list.ejs`)

A complete, production-ready CRUD interface that includes:
- ✅ Data table with Bootstrap 5 styling
- ✅ Create button and modal form
- ✅ Edit functionality
- ✅ Delete with confirmation
- ✅ Search/filter capability
- ✅ Empty state handling
- ✅ Loading states
- ✅ Client-side authentication checks
- ✅ API integration ready

### 2. **Table Component** (`components/table.ejs`)

A reusable Bootstrap 5 table component for displaying data.

---

## 📝 How to Use (2-Minute Setup)

### Step 1: Create Your Entity Page

Create a new file: `src/views/students.ejs` (or `courses.ejs`, `products.ejs`, etc.)

```ejs
<%- include('../components/crud-list', {
  title: 'Students',
  entityName: 'student',
  apiEndpoint: '/api/students',
  headers: ['Name', 'Email', 'Course', 'Enrolled Date'],
  columns: ['name', 'email', 'courseName', 'enrolledDate'],
  fields: [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'courseId', label: 'Course', type: 'select', required: true, options: [
      { value: '1', label: 'Computer Science' },
      { value: '2', label: 'Mathematics' }
    ]},
    { name: 'enrolledDate', label: 'Enrolled Date', type: 'date', required: true }
  ],
  searchable: true,
  createButton: true
}) %>

<%- include('../layouts/base', { 
  title: 'Students - Platform',
  body: '',
  scripts: ''
}) %>
```

### Step 2: Add Route

In `src/common/bootstrap/app-bootstrap.service.ts`:

```typescript
expressApp.get('/students', (req: any, res: any) => {
  res.render('students', {});
});
```

### Step 3: Create Backend API (Standard NestJS)

```typescript
// students.controller.ts
@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  @Get()
  findAll() { /* ... */ }
  
  @Get(':id')
  findOne(@Param('id') id: string) { /* ... */ }
  
  @Post()
  create(@Body() dto: CreateStudentDto) { /* ... */ }
  
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) { /* ... */ }
  
  @Delete(':id')
  remove(@Param('id') id: string) { /* ... */ }
}
```

**That's it!** You now have a complete CRUD interface.

---

## 🎨 Component Props

### `crud-list.ejs` Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Page title (e.g., "Students") |
| `entityName` | string | Yes | Entity name in lowercase (e.g., "student") |
| `apiEndpoint` | string | Yes | API endpoint (e.g., "/api/students") |
| `headers` | array | Yes | Table column headers |
| `columns` | array | Yes | Data property names matching headers |
| `fields` | array | Yes | Form fields configuration |
| `searchable` | boolean | No | Enable search (default: true) |
| `createButton` | boolean | No | Show create button (default: true) |

### Field Configuration:

```javascript
{
  name: 'fieldName',        // Property name
  label: 'Display Label',   // Form label
  type: 'text',             // Input type: text, email, date, select, textarea
  required: true,           // Required field
  options: [                // For select fields
    { value: '1', label: 'Option 1' }
  ]
}
```

---

## 📋 Examples

### Example 1: Students Management

See: `src/views/examples/students.ejs`

**Features:**
- Name, Email, Course selection
- Date picker for enrollment date
- Search functionality

### Example 2: Courses Management

See: `src/views/examples/courses.ejs`

**Features:**
- Course code and name
- Instructor selection
- Status dropdown
- Description textarea

---

## 🔧 Customization

### Custom Actions Column

The component automatically adds an Actions column with Edit/Delete buttons. To customize:

1. Modify the `renderTable()` function in `crud-list.ejs`
2. Add custom buttons or links

### Custom Styling

All components use CSS variables from the design system:
- `var(--color-primary-600)` - Primary color
- `var(--bg-primary)` - Background
- `var(--text-primary)` - Text color
- `var(--border-light)` - Border color

---

## 🎯 Interview Tips

### Quick Entity Setup (5 minutes):

1. **Copy example file** (`examples/students.ejs`)
2. **Update fields** to match your entity
3. **Add route** in bootstrap service
4. **Create controller** with standard CRUD endpoints
5. **Test** - Done!

### What This Shows:

✅ **Full-stack capability** - Frontend + Backend
✅ **Component reusability** - DRY principles
✅ **API design** - RESTful endpoints
✅ **UI/UX** - Professional, responsive design
✅ **Code organization** - Clean, maintainable structure

---

## 🚨 Important Notes

1. **Authentication**: All CRUD operations require a valid JWT token
2. **API Response Format**: Expects `{ data: [...] }` or `[...]` format
3. **Error Handling**: Basic error handling included (can be enhanced)
4. **Bootstrap 5**: Uses Bootstrap 5 classes (not Tailwind)

---

## 📚 Related Files

- `src/views/components/crud-list.ejs` - Main CRUD component
- `src/views/components/table.ejs` - Table component
- `src/views/examples/students.ejs` - Students example
- `src/views/examples/courses.ejs` - Courses example

---

## ✅ Checklist for Interview

When building a new CRUD entity:

- [ ] Create view file using `crud-list` component
- [ ] Add route in `app-bootstrap.service.ts`
- [ ] Create NestJS controller
- [ ] Create DTOs (CreateDto, UpdateDto)
- [ ] Create service with business logic
- [ ] Create repository for database operations
- [ ] Add Swagger documentation
- [ ] Test all CRUD operations

**Estimated Time**: 15-20 minutes for complete CRUD entity

---

**Status**: ✅ Interview-Ready
**Complexity**: Production-grade, reusable components

