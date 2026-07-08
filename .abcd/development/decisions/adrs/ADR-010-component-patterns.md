# ADR-010: Use Compound Components Pattern

## Status

Accepted

## Context

Itemdeck's Card component needs flexibility for:
- Different layouts (front/back)
- Optional elements (image, title, description)
- Customisable styling per slot
- Consistent behaviour across variants

We evaluated several component patterns:

| Pattern | Flexibility | Type Safety | Complexity |
|---------|-------------|-------------|------------|
| Compound Components | High | Good | Medium |
| Render Props | High | Medium | High |
| Slots/Children | Medium | Low | Low |
| Variants/Props | Low | High | Low |

## Decision

Use **compound components pattern** for complex components like Card.

## Consequences

### Positive

- **Flexible composition** - Users control layout
- **Explicit API** - Clear subcomponent names
- **Type safe** - Each subcomponent typed independently
- **Encapsulation** - Internal state hidden
- **Themeable** - Each part independently styleable

### Negative

- **More components** - Card.Front, Card.Back, Card.Image, etc.
- **Context overhead** - Shared state requires context
- **Learning curve** - Pattern less common

### Mitigations

- Document compound component usage
- Provide default compositions for common cases
- Type-check children at runtime if needed

## Implementation Pattern

```tsx
// Compound component structure
function Card({ children }: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <CardContext.Provider value={{ isFlipped, flip: () => setIsFlipped(!isFlipped) }}>
      <motion.article className={styles.card}>
        {children}
      </motion.article>
    </CardContext.Provider>
  );
}

Card.Front = function CardFront({ children }: { children: ReactNode }) {
  const { isFlipped } = useCardContext();
  return (
    <motion.div className={styles.face} style={{ opacity: isFlipped ? 0 : 1 }}>
      {children}
    </motion.div>
  );
};

Card.Back = function CardBack({ children }: { children: ReactNode }) {
  const { isFlipped } = useCardContext();
  return (
    <motion.div className={styles.face} style={{ opacity: isFlipped ? 1 : 0 }}>
      {children}
    </motion.div>
  );
};

Card.Image = function CardImage({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className={styles.image} />;
};

Card.Title = function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className={styles.title}>{children}</h3>;
};
```

## Usage Example

```tsx
<Card>
  <Card.Front>
    <Card.Image src={card.imageUrl} alt={card.name} />
    <Card.Title>{card.name}</Card.Title>
  </Card.Front>
  <Card.Back>
    <Card.Description>{card.description}</Card.Description>
  </Card.Back>
</Card>
```

## Alternatives Considered

### Render Props
- Maximum flexibility
- **Rejected**: Verbose, callback hell potential

### Slots/Children
- Simple API
- **Rejected**: Less type safety, magic strings

### Variant Props
- Single component
- **Rejected**: Too many props, less flexible

---

## Related Documentation

- [Modular Architecture Research](../../../research/modular-architecture.md)
- [F-001: Card Flip Animation](../../roadmap/features/planned/F-001-card-flip-animation.md)
