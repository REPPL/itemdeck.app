# R-004: Form Handling in React

## Executive Summary

For Itemdeck's entity editing feature, use **native React forms with controlled inputs** for simple edit forms, with the option to adopt **React Hook Form** if forms become more complex. Implement **schema-driven form generation** based on the v2 entity type definitions for automatic field rendering.

Key recommendations:
1. Start with native controlled forms (simpler, no dependencies)
2. Use Zod for validation (already in the codebase)
3. Generate form fields dynamically from entity schema
4. Implement optimistic UI updates with rollback
5. Consider React Hook Form for complex multi-step forms later

## Current State in Itemdeck

Itemdeck currently uses:
- **No forms** - Application is read-only
- **Zod schemas** for data validation (`src/schemas/v2/collection.schema.ts`)
- **Entity type definitions** in collection.json defining field structures
- **CardExpanded modal** as the natural location for edit UI

The editing feature will need forms that can dynamically render based on entity field definitions.

## Research Findings

### Form Library Comparison

| Library | Bundle Size | Learning Curve | Validation | Schema-Driven |
|---------|-------------|----------------|------------|---------------|
| **Native React** | 0KB | Low | Manual/Zod | Manual |
| **React Hook Form** | 12KB | Medium | Built-in + Zod | Possible |
| **Formik** | 15KB | Medium | Yup/Zod | Limited |
| **TanStack Form** | 8KB | Medium | Built-in | Yes |

### Native React Controlled Forms

Best for simple forms with predictable fields:

```typescript
// src/components/EditForm/EditForm.tsx
import { useState, FormEvent } from 'react';
import type { DisplayCard } from '@/types/card';

interface EditFormProps {
  card: DisplayCard;
  onSave: (updates: Partial<DisplayCard>) => void;
  onCancel: () => void;
}

export function EditForm({ card, onSave, onCancel }: EditFormProps) {
  const [formData, setFormData] = useState({
    title: card.title,
    year: card.year ?? '',
    summary: card.summary ?? '',
    myVerdict: card.myVerdict ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.year && isNaN(Number(formData.year))) {
      newErrors.year = 'Year must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        title: formData.title,
        year: formData.year || undefined,
        summary: formData.summary || undefined,
        myVerdict: formData.myVerdict || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <div className="form-field">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={e => handleChange('title', e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && <span id="title-error" className="error">{errors.title}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="year">Year</label>
        <input
          id="year"
          type="number"
          value={formData.year}
          onChange={e => handleChange('year', e.target.value)}
          aria-invalid={!!errors.year}
        />
        {errors.year && <span className="error">{errors.year}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="summary">Summary</label>
        <textarea
          id="summary"
          value={formData.summary}
          onChange={e => handleChange('summary', e.target.value)}
          rows={4}
        />
      </div>

      <div className="form-field">
        <label htmlFor="myVerdict">My Verdict</label>
        <textarea
          id="myVerdict"
          value={formData.myVerdict}
          onChange={e => handleChange('myVerdict', e.target.value)}
          rows={2}
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Save Changes</button>
      </div>
    </form>
  );
}
```

### React Hook Form Pattern

For more complex forms with many fields:

```typescript
// src/components/EditForm/EditFormHookForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const editSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  year: z.number().int().min(1900).max(2100).optional(),
  summary: z.string().optional(),
  myVerdict: z.string().optional(),
  myRank: z.number().int().min(1).optional(),
});

type EditFormData = z.infer<typeof editSchema>;

export function EditFormHookForm({ card, onSave, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: card.title,
      year: card.year ? Number(card.year) : undefined,
      summary: card.summary ?? '',
      myVerdict: card.myVerdict ?? '',
    },
  });

  const onSubmit = (data: EditFormData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-field">
        <label htmlFor="title">Title *</label>
        <input {...register('title')} id="title" />
        {errors.title && <span className="error">{errors.title.message}</span>}
      </div>

      {/* More fields... */}

      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
```

### Schema-Driven Form Generation

Generate form fields from entity type definitions:

```typescript
// src/components/EditForm/SchemaFormField.tsx
import type { FieldDefinition } from '@/types/schema';

interface SchemaFormFieldProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function SchemaFormField({ field, value, onChange, error }: SchemaFormFieldProps) {
  const { name, type, label, required, description } = field;
  const id = `field-${name}`;

  const renderInput = () => {
    switch (type) {
      case 'string':
        return (
          <input
            id={id}
            type="text"
            value={value as string ?? ''}
            onChange={e => onChange(e.target.value)}
            required={required}
            aria-invalid={!!error}
          />
        );

      case 'text':
        return (
          <textarea
            id={id}
            value={value as string ?? ''}
            onChange={e => onChange(e.target.value)}
            required={required}
            rows={4}
          />
        );

      case 'number':
        return (
          <input
            id={id}
            type="number"
            value={value as number ?? ''}
            onChange={e => onChange(e.target.valueAsNumber)}
            required={required}
          />
        );

      case 'array':
        // Tag input for arrays
        return <TagInput value={value as string[]} onChange={onChange} />;

      default:
        return <span>Unsupported field type: {type}</span>;
    }
  };

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label ?? name}
        {required && ' *'}
      </label>
      {description && <p className="field-description">{description}</p>}
      {renderInput()}
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}

// Usage: Generate form from schema
function SchemaForm({ entityType, entity, onSave }) {
  const editableFields = entityType.fields.filter(f => f.editable !== false);

  return (
    <form onSubmit={handleSubmit}>
      {editableFields.map(field => (
        <SchemaFormField
          key={field.name}
          field={field}
          value={entity[field.name]}
          onChange={value => updateField(field.name, value)}
        />
      ))}
    </form>
  );
}
```

### Validation with Zod

Integrate with existing Zod schemas:

```typescript
// src/schemas/editEntity.schema.ts
import { z } from 'zod';

// Base editable fields common to all entities
export const baseEditableSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().optional(),
});

// Game-specific editable fields
export const gameEditSchema = baseEditableSchema.extend({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  myVerdict: z.string().optional(),
  myRank: z.coerce.number().int().min(1).optional(),
  myStartYear: z.coerce.number().int().min(1900).max(2100).optional(),
  genres: z.array(z.string()).optional(),
});

// Validation helper
export function validateEdit<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach(err => {
    const field = err.path[0]?.toString() ?? 'unknown';
    errors[field] = err.message;
  });

  return { success: false, errors };
}
```

### Accessibility Requirements

Forms must be accessible:

```typescript
// Accessibility patterns for edit forms
const formAccessibility = {
  // Required fields
  requiredFields: {
    'aria-required': true,
    required: true,
  },

  // Error states
  errorState: (hasError: boolean, errorId: string) => ({
    'aria-invalid': hasError,
    'aria-describedby': hasError ? errorId : undefined,
  }),

  // Form region
  formRegion: {
    role: 'form',
    'aria-labelledby': 'form-title',
  },

  // Live region for errors
  errorAnnouncement: {
    role: 'alert',
    'aria-live': 'polite',
  },
};
```

## Recommendations for Itemdeck

### Priority 1: Start with Native Forms

1. **Create simple EditForm** using controlled inputs
2. **Integrate Zod** for validation (already available)
3. **Match CardExpanded styling** for consistent UI
4. **Implement keyboard navigation** (Tab, Enter, Escape)

### Priority 2: Schema-Driven Generation

1. **Extend entity schema** with editable field metadata
2. **Create SchemaFormField** component
3. **Generate forms dynamically** from entity type definitions
4. **Support common field types**: string, text, number, array

### Priority 3: React Hook Form (If Needed)

1. **Only adopt if** forms become complex (multi-step, conditional fields)
2. **Install** `react-hook-form` and `@hookform/resolvers`
3. **Migrate** to useForm pattern
4. **Keep Zod** for validation via zodResolver

### When to Use Each Approach

| Scenario | Recommendation |
|----------|----------------|
| Single entity edit with < 10 fields | Native React forms |
| Multiple entity types | Schema-driven generation |
| Complex validation dependencies | React Hook Form + Zod |
| Multi-step edit wizard | React Hook Form |
| Inline editing | Native React forms |

## Implementation Considerations

### Dependencies

For native approach:
- **None** - Uses React built-ins + existing Zod

For React Hook Form (optional):
```json
{
  "dependencies": {
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x"
  }
}
```

### Bundle Size Impact

| Approach | Additional Size |
|----------|-----------------|
| Native | 0KB |
| React Hook Form | ~12KB gzipped |
| Formik | ~15KB gzipped |

### Integration Points

1. **CardExpanded** - Add Edit button and edit mode state
2. **editsStore** - Save form data to Zustand store
3. **useCollection** - Merge edits with source data
4. **collection.json** - Reference for field definitions

### Testing Strategy

```typescript
// EditForm.test.tsx
describe('EditForm', () => {
  it('renders all editable fields', () => {});
  it('validates required fields on submit', () => {});
  it('shows validation errors accessibly', () => {});
  it('calls onSave with updated data', () => {});
  it('calls onCancel without saving', () => {});
  it('prevents submission while invalid', () => {});
  it('tracks dirty state correctly', () => {});
});
```

## References

- [React Forms Documentation](https://react.dev/reference/react-dom/components/form)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [ARIA Forms Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/form/)
- [MDN Form Validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)

---

## Related Documentation

- [F-050: Edit Form Component](../roadmap/features/completed/F-050-edit-form-component.md) - Form implementation
- [ADR-014: Entity Edit Architecture](../decisions/adrs/ADR-014-entity-edit-architecture.md) - Edit architecture decision
- [ADR-015: Edit Mode UX Pattern](../decisions/adrs/ADR-015-edit-mode-ux.md) - UX pattern decision
- [State Persistence Research](./state-persistence.md) - State persistence patterns
- [Accessibility Research](./accessibility.md) - Accessibility requirements

---

**Applies to**: Itemdeck v0.10.0+
