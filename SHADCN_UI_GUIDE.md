# Shadcn UI Setup Guide

Shadcn UI has been successfully integrated into your Cortex project! 🎉

## ✅ What's Already Set Up

- ✅ Shadcn UI configuration (`components.json`)
- ✅ Utility functions (`src/lib/utils.ts`)
- ✅ CSS variables and theming (`src/app/globals.css`)
- ✅ Core components: Button, Card, Input

## 📦 Available Components

Currently installed components:
- **Button** - `@/components/ui/button`
- **Card** - `@/components/ui/card`
- **Input** - `@/components/ui/input`

## 🚀 Adding More Components

You can add more Shadcn UI components using the CLI:

```bash
npx shadcn@latest add [component-name]
```

### Popular Components to Add:

```bash
# Forms & Inputs
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch

# Feedback
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog

# Layout
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add tabs

# Data Display
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar

# Navigation
npx shadcn@latest add dropdown-menu
npx shadcn@latest add navigation-menu
```

## 💡 Usage Example

The `AuthForm` component has been updated to use Shadcn UI components as an example:

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Use in your component
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="Enter text" />
    <Button>Click me</Button>
  </CardContent>
</Card>
```

## 🎨 Button Variants

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

## 📚 Documentation

- [Shadcn UI Components](https://ui.shadcn.com/docs/components)
- [Installation Guide](https://ui.shadcn.com/docs/installation)
- [Theming](https://ui.shadcn.com/docs/theming)

## 🎯 Next Steps

1. Add more components as needed using `npx shadcn@latest add`
2. Update existing components to use Shadcn UI for consistency
3. Customize the theme in `src/app/globals.css` if needed

Happy coding! 🚀
