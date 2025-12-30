# Modern Card UI/UX Design Patterns Research

> **Note**: For state-of-the-art implementation research (2024-2025) including Material Design 3 and specific itemdeck recommendations, see [Card UI Design Patterns Research](../development/research/card-ui-design-patterns.md). This document contains general design exploration.

Comprehensive research on card-based interface design patterns, focusing on rich data display, information density, progressive disclosure, and user interaction patterns.

---

## Table of Contents

1. [Card-Based Interfaces](#card-based-interfaces)
2. [Information Density](#information-density)
3. [Progressive Disclosure Patterns](#progressive-disclosure-patterns)
4. [Visual Hierarchy Techniques](#visual-hierarchy-techniques)
5. [Card Stack and Wallet Metaphors](#card-stack-and-wallet-metaphors)
6. [Drag and Drop Patterns](#drag-and-drop-patterns)
7. [Responsive Card Sizing](#responsive-card-sizing)
8. [Visual Design Techniques](#visual-design-techniques)
9. [Typography for Cards](#typography-for-cards)
10. [Accessibility Considerations](#accessibility-considerations)
11. [Real Application Examples](#real-application-examples)

---

## Card-Based Interfaces

### Definition and Core Concepts

A **Card UI** is a design style where content is organised into small rectangular blocks, like digital "cards." Each card usually shows one piece of information—an image, title, short text, and possibly a button. Cards are united by the same concept where each card represents one idea, item, or piece of content.

### Key Benefits

**Responsive and Adaptive**
- Cards are responsive, visually engaging, and intuitive for users
- Their modular structure works well across devices
- Makes browsing or comparing items simple
- Can adapt their presentation to fit the display of any device—from desktop to smart watch

**Information Organisation**
- Cards don't take up much space and force the designer to prioritise content and form
- Each card becomes digestible pieces of content that are easily accessed and scanned
- The resemblance to the physical world makes them a great conceptual metaphor
- Cards seem familiar to users (business cards, baseball cards, sticky notes)

**Interactive Capabilities**
- Cards are being developed in the context of modern client-side web stack (HTML, CSS, JavaScript)
- This allows cards to go beyond the visual to be truly interactive
- One of the most important things about cards is their ability to be manipulated almost infinitely
- Can be turned over to reveal more, stacked to save space, folded for a summary and expanded for details, sorted, and grouped

### When to Use Cards vs. Alternatives

**Use Cards When:**
- Displaying heterogeneous content (different types of information)
- Each item is independent and self-contained
- Visual presentation matters (images, icons)
- Users need to browse or compare items
- Content needs to work across different screen sizes

**Use Alternatives When:**
- Data-heavy or highly structured information is needed
- Quick scanning or hierarchical order is essential
- Lists or tables may be a better fit for structured data
- Dense information requires efficient space usage

### Card Component Structure

Cards typically contain:
- Image (optional but common)
- Title/heading
- Description or body text
- Call to action (button or link)
- Sometimes subheadings or icons
- Metadata (dates, tags, categories)

**Best Practice:** A card should contain only essential information and offer a linked entry point to further details, rather than the full details themselves.

---

## Information Density

### Core Principles

**Data-Ink Ratio**
- Edward Tufte introduces the concept of "data-ink"—the useful parts of a visualisation
- Information density is measurable: divide the amount of "data-ink" by the total amount of ink
- Goal: get the ratio as close to 1 as possible
- Visual elements that don't strictly communicate data should be eliminated

**Upper Limits and Audience**
- There's an upper limit to information density
- The audience matters significantly:
  - Bond trader at 4-monitor desk: high threshold
  - General consumer app: moderate threshold
  - Educational content for children: low threshold

### Balancing Density with Absorption

**The Paradox**
- The more data on screen, the less likely users will absorb it
- It's not about allowing users to see data—it's about breaking it down to be understandable and digestible
- Too minimal is possible, usually at the expense of power users
- Form still needs to follow function

**User-Specific Density**
- **Non-power users**: snapshot of data, limited functionality
- **Power users**: rich data, more functionality
- **Executives**: high-level data with capacity to drill down
- **Analysts**: more data visible at once

### Techniques for Managing Density

**Spacing and Layout**
- Dense UIs require intentional spacing, not just open space
- In high-density contexts, use tight but consistent padding (4px, 8px, 12px grid spacing instead of 16-24px)
- Trim button padding appropriately—opt for compact, not tiny buttons (32 or 36 pixel height)
- Adopt progressive disclosure—collapse or hide rarely used controls behind "More" or "…" menus

**Typography**
- Use smaller font sizes and line heights for dense interfaces
- Body font size of 14px with line height of 20px helps deliver compact UI
- Maintain readability—don't go too small

**Visual Hierarchy**
- The aversion to high-density interfaces is largely aversion to poorly designed dense interfaces
- When people say "busy" or "cluttered," they're reacting to poor information and visual hierarchy
- Clear hierarchy makes high-density interfaces work

**Data Prioritisation**
- Not every piece of data has equal importance
- The first step to effective design is prioritising different data on cards
- Use visual weight, size, and position to indicate importance

**Grouping Principles**
- Try to group cards that display similar content to enhance understanding
- Use Gestalt design principles based on relevance for optimised information grouping
- Maintain alignment—crucial for organised interface
- Keep sufficient and consistent spacing between cards (8px or 12px common)

---

## Progressive Disclosure Patterns

### Definition

**Progressive disclosure** is one of the best ways to satisfy conflicting user requirements for both power and simplicity. It's a simple, yet powerful idea: initially show users only a few of the most important options, then offer a larger set of specialised options upon request.

### Core Benefits

**Cognitive Load Reduction**
- Reduces cognitive load by hiding complexity
- Guides new users through simplified experience
- Empowers experts with access to advanced features
- Users see what they need when they need it

**User Experience**
- Secondary features are disclosed only if a user asks for them
- Most users can proceed with tasks without worrying about added complexity
- Satisfies conflicting requirements for power and simplicity

### Implementation Patterns

**Expandable Cards**
- Summary cards can expand to reveal detailed analytics without leaving main view
- Key metrics appear in collapsed state
- Single click expands to reveal next level of detail
- Example: shipment tracker showing ID, status, origin, destination in collapsed state; expanding shows transit history, documentation status, potential delays

**Accordions and Panels**
- Use panels that expand when clicked, revealing more information
- Keeps pages clear and simple
- Reveals content only when needed
- Maintain clear visual indicators of expandable state

**Modal Windows**
- Designers use modal windows to hide advanced features and information
- Keeps primary UI straightforward and inviting
- Provides focused context for detailed operations

**Steppers for Complex Forms**
- Break forms into smaller, manageable steps
- Reduces cognitive load
- Particularly useful when user choices affect subsequent options
- Ensures focus on one task at a time
- Adapts fields based on previous selections

### Best Practices

**Limit Disclosure Levels**
- A single secondary screen is typically sufficient for each instance
- Multiple layers can confuse users
- Designs going beyond 2 disclosure levels typically have low usability
- Users often get lost when moving between levels
- If 3+ levels needed, consider simplifying design

**Visual Feedback**
- Incorporate subtle hover effects or click animations
- Makes interface feel responsive and engaging
- Provide clear indicators of what's expandable
- Show current state (expanded/collapsed)

**Maintain Context**
- Don't make users lose their place
- Smooth transitions between states
- Allow easy return to previous view

---

## Visual Hierarchy Techniques

### Typography Hierarchy

**Size and Weight**
- Hierarchy within cards helps direct attention to most important information
- Place primary content at top of card
- Use typography to emphasise primary content
- Mix font weights dramatically within single headlines
- Ultra-thin letters might sit next to bold, chunky ones
- Serif and sans-serif fonts combine in unexpected ways

**2025 Typography Trends**
- Typography is becoming a design element in its own right
- Not just a way to convey information
- Saturated gradients, strong contrasts, and expressive fonts create energy
- Establishes visual hierarchy and draws attention to key elements

**Card-Specific Typography**
- Test card designs across various devices
- Ensure text is legible
- Interactive elements large enough to tap on smaller screens
- Use clear hierarchy: title > subtitle > body > metadata

### Spatial Hierarchy

**Positioning**
- Most important information at top
- Actions at bottom (or top-right for quick access)
- Metadata typically bottom or subtle top corner
- Follow F-pattern or Z-pattern reading flows

**Spacing**
- Use whitespace to create separation between elements
- Consistent internal padding creates cohesion
- External margins separate cards from each other
- Typically 8px, 12px, or 16px spacing between cards

**Alignment**
- Maintaining alignment is crucial for organised interface
- Left-align text for readability
- Centre-align only for short, impactful content
- Grid alignment across cards creates visual order

### Colour and Contrast Hierarchy

**Visual Weight Through Colour**
- Primary actions: high-contrast colours
- Secondary actions: muted or outline styles
- Metadata: lower-contrast greys
- Status indicators: semantic colours (success green, error red)

**Backgrounds**
- Subtle background colours can categorise cards
- Gradients add depth and visual interest
- Maintain sufficient contrast for readability (4.5:1 minimum for body text)

### Depth and Elevation

**Material Design Elevation**
- Elevation determines appearance of shadow
- Shadows provide visual cues about objects' depth
- Cards with subtle shadow appear to float above background
- Modal with deeper shadow signals interruption and priority

**Elevation Levels**
- Most systems define fixed number of elevation levels
- Typically 4-6 levels: flat content (0), cards (1), popups (2), modals (3-4), overlays (5-6)
- Too many levels create decision fatigue
- Each level measured in density-independent pixels (dp)

**Shadow Implementation**
- Shadows are the only visual cue indicating separation between surfaces
- Object's elevation determines shadow appearance
- Resting elevations consistent across apps but may vary by platform
- Desktop resting elevation typically 2dp below mobile values

### Imagery and Icons

**Visual Anchors**
- Images draw eye first—use strategically
- Icons provide quick recognition and visual interest
- Thumbnail images (typically 90x90 points) displayed next to fields
- Aspect ratio should be 2:3 to 3:2 range, otherwise cropped

**Visual Balance**
- Balance text-heavy cards with imagery
- Use icons to replace text labels where clear
- Consistent icon style across card set

---

## Card Stack and Wallet Metaphors

### Physical World Metaphor

**Conceptual Foundation**
- Cards look similar to real-world tangible cards
- Seem familiar to users from real life: business cards, baseball cards, sticky notes
- Cards represent a helpful visual metaphor
- Allow brains to intuitively connect card with content it represents

**Manipulation Affordances**
- Can be turned over to reveal more
- Stacked to save space
- Folded for summary, expanded for details
- Sorted and grouped
- Resemblance to physical world makes manipulations intuitive

### Apple Wallet Design Patterns

**Pass Styles**
- **Store Cards**: loyalty cards, discount cards, points cards, gift cards
  - Typically identifies account user has with company
  - Can be used for payments or discounts
  - Show current balance when account carries balance

- **Generic Passes**: any pass not fitting specific styles
  - Gym membership cards, coat-check tickets, metro passes with balance

- **Event Tickets**: distinctive cutout at top edge
- **Coupons**: perforated edge visual

**Visual Design**
- Pass style determines overall visual appearance
- Template for placement of information
- Most distinctive visual indication at top edge
- Allotted space varies by type:
  - Event tickets: 375 x 98 points
  - Gift cards/coupons: 375 x 144 points
  - Others: 375 x 123 points

**Information Hierarchy**
- Description should start with high-level term ("Membership card," "Weekly coupon," "Bus ticket")
- Follow with one or two small pieces of information
- Don't summarise entire contents
- Include enough detail to distinguish between passes of same type

### Card Stack Patterns

**Stacking Behaviours**
- In scrolling card collection, cards are siblings
- All move together in tandem
- Children of card collection object that controls movement
- Visual stacking shows depth through overlapping
- Top card fully visible, others partially visible underneath

**Interaction Patterns**
- Tap/click to bring card to front
- Swipe to cycle through stack
- Pinch/spread to expand/collapse stack
- Pull to reveal card underneath

**Cardstack Design Paradigm**
- Decentralised user experience reimagines apps as cards
- Composable, interoperable pieces of functionality
- Draw upon shared design patterns
- Common set of patterns across different applications

**Pattern Categories**
- Construction patterns: how individual cards are built
- Assembly patterns: how cards are grouped and organised
- Interaction patterns: how users manipulate cards
- Navigation patterns: moving between cards and collections

---

## Drag and Drop Patterns

### Visual Feedback

**During Drag State**
- Drag-and-drop requires cursor changes and "ghost" image of component
- "Lifting up" item towards user in z-dimension once grabbed
- Makes item stand out from others
- Indicates item's state has changed
- Selected item should be highlighted during interaction
- Highlight colour different from hover state

**Ghost and Placeholder**
- Ghost list item shows item as "still there"
- Reassuring to user that item not truly displaced
- Monochrome placeholder appears where item will drop
- Provides preview of final position

**Drop Indicators**
- Line or box provides clear visual cues indicating where dragging
- Minimal drop indicator can work without requiring movement of other items
- Slots item into list cleanly
- Alternative: push items out of way with visual indicator (horizontal line or temporary empty card)
- Both approaches give users preview of where item will land

### Drag Handles

**Visual Affordance**
- Use always-visible drag handle icon
- Exception: when drag-and-drop is "implied" (e.g., cards on board)
- Six-dot drag handle most common (similar to Notion)
- Multi-purpose drag-and-drop uses drag-indicator icon
- Most common signifier for horizontal and vertical reordering

**Alternative Controls**
- Up/down arrows positioned to right of item
- Useful for accessibility and mobile
- Often simpler and more accessible than drag-and-drop

### Animation and Timing

**Movement Feedback**
- When reordering list, show background objects moving out of way before user releases
- Short animation gives preview of what will happen
- Use quick animation (roughly 100ms)
- Show items moving towards new location

**Trigger Points**
- Many implementations start moving items when edges meet
- Alternative: move item out of way once centre of dragged component overlaps edge of other component
- Slightly stronger intent indication

### Drop Zone Design

**Sizing Balance**
- Drop zone should be perfect size
- Just large enough to prevent confusion between columns
- Not so small that it requires excessive precision
- Balance between generous and restrictive

### Touch and Mobile Considerations

**Challenges**
- Drag-and-drop can be hard on touchscreens (lack hover states)
- Fat-finger problem: ensure draggable objects have at least 1cm x 1cm unused space
- Ensure fingers don't cover important feedback
- Must distinguish among tap, swipe gesture, and intentional "grab"
- Use timing delay of few milliseconds
- Provide clear feedback that object has been grabbed

**Mobile Alternatives**
- Consider fallback controls like swipe-to-move
- Up/down arrows to reorder list elements
- Often simpler on smaller screens
- Better accessibility

### Accessibility

**Alternative Methods**
- Drag-and-drop not fully accessible
- Consider supporting alternate ways to rearrange content
- Include up/down buttons to reorder items
- Action menu trigger on draggable entities
- Enables same outcomes for assistive technology users

**Undo Support**
- Remove ghost image on drop
- Support undo functionality
- Critical safety net for users

---

## Responsive Card Sizing

### CSS Grid Auto-Fit Approach

**No Media Queries Needed**
```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

**How It Works**
- Most popular approach for responsive cards
- Minimum width of card is 300px (configurable)
- As many 300px cards that can fit appear in row
- When device very small, not enough space for two cards
- 1fr comes into play—single card takes up all available space
- Cards stack on top of each other
- Results in tracks being 1fr when plenty of space (desktop)
- 240px when not enough space for both columns (mobile)

**Full Responsiveness**
- Set number of columns to auto-fit instead of fixed number
- When minimum card width reached, new row added
- All cards stacked below
- CSS Grid contributed to writing more resilient code
- Replacing "hacky" techniques
- In some cases, killing need for viewport-specific code

### Flexbox Approach

**When to Use**
- Flexbox is one-dimensional layout model
- Excels at distributing space along single axis (horizontal or vertical)
- Perfect for flexible and dynamic layouts within single container
- Grid better for structured multi-row layouts
- Flexbox great for one-dimensional layouts (like row of cards)

### Mobile-First Strategy

**Progressive Enhancement**
- When coding mobile-first, cards take up whole row each (one column)
- Assumes user using small screen
- Progressive enhancement adds columns as space allows
- Start with single column, add complexity

### Bootstrap Grid System

**Responsive Breakpoints**
- Powerful mobile-first flexbox grid
- Twelve column system
- Six default responsive tiers
- Sass variables and mixins
- Dozens of predefined classes
- Breakpoints based on min-width media queries
- Affect that breakpoint and all above it
- Control container and column sizing by each breakpoint

### Best Practices

**Card Sizing**
- Test across various devices
- Ensure minimum touch target size (44x44 pixels minimum)
- Interactive elements large enough to tap on smaller screens
- Text remains legible at all sizes
- Images scale appropriately

**Spacing**
- Maintain consistent spacing between cards
- Typically 8px, 12px, or 16px
- May need to adjust for smaller screens
- Balance between density and clarity

**Content Adaptation**
- Consider hiding secondary content on mobile
- Prioritise most important information
- Progressive disclosure especially valuable on small screens
- May need different card layouts for different breakpoints

---

## Visual Design Techniques

### Glassmorphism

**Definition and Characteristics**
- UI trend where design elements have appearance of translucent frosted glass
- Frosted glass effect with backgrounds blurred behind semi-transparent panels
- Mimics look of glass
- Creates sense of depth and dimensionality
- Maintains sleek, modern aesthetic

**Key Visual Elements**
- Frosted-glass effect with transparency, blur, and subtle border
- Creates sense of depth and hierarchy
- Often used for card-based layouts and overlays
- Light, airy feel
- Overlapping elements with varying degrees of transparency

**Visual Hierarchy Benefits**
- Functional style upgrade
- Layered transparency makes easy to create clear visual hierarchy
- Without relying only on colour or typography
- Foreground panels stand out
- Blurred background provides just enough context
- Helps understand surroundings while staying focused

**2025 Updates**
- Apple's Liquid Glass has taken it to next level
- Real-time depth, motion, and adaptive contrast
- Across all platforms
- Brings warmth and polish after years of flat design
- Apple rolled out first glassmorphic elements in macOS Big Sur and iOS
- Taken to next level with iOS 26 and macOS Tahoe in 2025
- Microsoft followed with Windows 11's Fluent Design System

**Best Practices**
- Best when utilised sparingly to create illusion of depth
- Consider using established design systems (Apple's SwiftUI)
- Avoid potential issues creating glassmorphic materials from scratch
- Be mindful of how translucent components affected by background elements
- Maintain visual hierarchy and accessibility requirements
- Avoid placing blur over important text or buttons
- Pair with clear typography and contrasting backgrounds
- Maintains elegance while keeping interfaces usable

**Design Aesthetic**
- Despite layered approach, maintains minimalist and clean aesthetic
- Focuses on essential elements without clutter
- Often paired with clean typography and simplified icons

### Gradients

**Modern Usage**
- Saturated gradients create energy
- Establish visual hierarchy
- Draw attention to key elements
- Strong contrasts with expressive fonts
- No longer just backgrounds—active design elements

**Card Applications**
- Subtle gradients add depth without overwhelming
- Can indicate status or category
- Draw eye to important cards
- Create visual interest in card collections

### Shadows and Depth

**Material Design Approach**
- Shadows provide important visual cues about depth
- Only visual cue indicating separation between surfaces
- Object's elevation determines shadow appearance
- Consistent resting elevations across apps

**Implementation**
- In practice, elevation expressed through CSS shadows
- Layering or visual separation
- Card with subtle shadow appears to float
- Modal with deeper shadow signals interruption

**Shadow Depth Levels**
- Typically 4-6 defined levels
- Level 0: Flat content (base layout)
- Level 1: Cards
- Level 2: Popups or dropdowns
- Level 3-4: Modals
- Level 5-6: Interactive overlays
- Each level measured in device-independent pixels (dp)

**CSS Implementation Example**
- z-depth-1 through z-depth-6 classes common
- Apply shadow effect by adding class to HTML tag
- Symbols with shadow depth property from 0 to 6 DP

---

## Typography for Cards

### Font Selection

**Hierarchy Through Type**
- Mix font weights dramatically within headlines
- Ultra-thin letters next to bold, chunky ones
- Serif and sans-serif combinations in unexpected ways
- Typography as design element, not just information conveyance

**Readability First**
- Body text: 14-16px typical size
- Line height: 1.4-1.6 for readability
- Sufficient contrast (4.5:1 minimum for body text)
- Test across devices for legibility

### Type Scale

**Card-Specific Hierarchy**
- **Title**: 18-24px, bold or semi-bold weight
- **Subtitle**: 14-16px, medium weight
- **Body**: 14-16px, regular weight
- **Metadata**: 12-14px, regular weight, often lower contrast

**Consistency**
- Maintain consistent type scale across card set
- Use same fonts for same purposes
- Creates visual rhythm and predictability

### Typography Best Practices

**Contrast and Colour**
- High contrast for titles (ensure 4.5:1 ratio)
- Medium contrast for body text
- Lower contrast for metadata (but maintain 4.5:1 minimum)
- Use colour to indicate status or category, not as only differentiator

**Line Length**
- Optimal: 50-75 characters per line
- On cards, often shorter due to width constraints
- Adjust line height if lines very short or very long

**Alignment**
- Left-align text for readability
- Centre-align only for short, impactful content
- Right-align sparingly (e.g., prices, dates)

**Truncation**
- Use ellipsis for overflow text
- Provide way to see full content (hover, expand)
- Don't truncate critical information

### Responsive Typography

**Fluid Type**
- Consider fluid typography that scales with viewport
- Maintains readability across devices
- Uses calc() and viewport units

**Mobile Considerations**
- May need slightly larger base size on mobile (16px minimum)
- Avoid fonts that become illegible when small
- Ensure tap targets around text links sufficient size

---

## Accessibility Considerations

### Keyboard Navigation

**Focus Management**
- Content accessible through keyboard alone
- All links and buttons in card accessible via keyboard
- Focus follows logical order in relation to other card content
- Focus indicator clearly visible around interactive elements
- Keyboard actions don't trap focus
- Can tab into and out of each card easily

**Focus Indicators**
- Visible focus states non-negotiable under WCAG 2.1.1
- Help users understand which element currently active
- Ensure minimum 3:1 contrast ratio between focused and unfocused states
- Use combination of visual cues: colour changes, outlines, underlines
- Apply same focus indicators to similar elements throughout interface
- Make indicators prominent and easy to see (border width at least 2px)

### Colour Contrast

**WCAG Requirements**
- Card content meets colour contrast requirements
- Text and background colour at least 4.5:1 contrast
- For WCAG 2.1 AA compliance (required in 2026):
  - Links different colour with 3:1 contrast against unlinked text
  - Under success criterion 1.4.11

**Testing**
- Use colour contrast analyser
- Test all text against backgrounds
- Include hover and focus states
- Don't rely on colour alone to convey information

### Screen Reader Compatibility

**Content Announcement**
- Content announced in same order it appears on page
- When navigating with screen reader, announced content matches visual presentation
- Screen reader announces roles and states of links
- Hear each element's role announced
- If links present, hear if link visited or not

**Semantic HTML**
- Use proper heading hierarchy
- Use semantic elements (article, section) for cards
- Provide meaningful alt text for images
- Use ARIA labels when necessary

### Redundant Links

**Best Practice**
- Redundant links not WCAG failure but established best practice to avoid
- Create poor experience for blind users with screen readers
- Have to listen to link read twice as they tab through content
- Sighted screen reader users and keyboard-only users tab through twice as many links

**Solution for Duplicate Links**
- If determined to have title and image as separate links:
  - Apply tabindex=-1 to images (removed from tab order)
  - Alt text should describe image content, not link destination
  - Image won't function as link for screen reader users

### Touch Targets

**Minimum Size**
- At least 44x44 pixels for touch targets
- Sufficient spacing between targets
- Avoid requiring precise taps
- Consider fat-finger problem on mobile

### WCAG Compliance Standards

**Current Requirements**
- Compliant with WCAG 2.2 standards
- Section 508 requirements
- Follow WAI-ARIA best practices
- Card component should be tested in context of entire site
- Isolation testing not sufficient for full compliance

**Testing Approach**
- Test components in isolation first
- Then test in context of full site/application
- Use automated tools and manual testing
- Include users with disabilities in testing

---

## Real Application Examples

### Apple Wallet

**Pass Design Guidelines**
- Pass style determines overall visual appearance
- Template for placement of information
- Distinctive visual indication at top edge (cutouts, perforations)

**Image Specifications**
- Allotted space varies by pass type
- Thumbnail images 90x90 points
- Aspect ratio 2:3 to 3:2 range

**Accessibility**
- Descriptions start with high-level term
- Include one or two small pieces of distinguishing information
- Don't summarise entire contents
- Include enough detail to distinguish between passes of same type

**Design Resources**
- Official templates available on Figma
- Examples of boarding pass, event ticket, wallet card
- Apple provides badges and logos for marketing material

### Google Pay and Samsung Pay

**Card Display**
- Visual representation of physical cards
- Realistic shadows and materials
- Card number partially masked
- Quick access to common actions

**Interaction Patterns**
- Tap to select default card
- Swipe to browse cards
- Pull-down for additional options
- Quick payment gesture

### Banking Applications

**Credit Card Forms**
- Indicate card type being used visually
- Reassures user input matches card in hand
- Card type determined from first number
- Display card logo inside input field, floated right

**Error Handling**
- System error: leave fields populated for retry
- Card declined: clear data (potential fraud indicator)

**UX Best Practices**
- "Lock" icon in form fields indicates data safety
- "/" between expiration date fields matches card format
- Auto-detection of credit card numbers
- Quick response displaying card type icon
- Security Code (CVV) field with textual prompt ("Last 3 digits on back")

**Visual Design**
- Realistic card representations
- Account balances prominently displayed
- Transaction history in digestible cards
- Status indicators (pending, completed, failed)

### Design Resources

**Dribbble Examples**
- Plexo mobile app
- Billing settings pages
- Fintech landing pages
- E-wallet onboarding illustrations
- Virtual currency wallet apps
- Velobank Neo Bank Card Dashboard App UI
- Finexa Bank Card Design
- Unipay bank card designs

**Behance Projects**
- Punto Pago Banking App (1,687 appreciations)
- Alinma Bank Rebranding & Mobile App (2,529 appreciations)
- Mobile App for Child Bank Card
- NovaCard Payment Mobile App

---

## Related Documentation

- [Apple Wallet Design Guidelines](https://developer.apple.com/design/human-interface-guidelines/wallet) - Official Apple documentation
- [Material Design Elevation](https://m3.material.io/styles/elevation/applying-elevation) - Google's Material Design elevation system
- [Progressive Disclosure Pattern](https://www.interaction-design.org/literature/topics/progressive-disclosure) - IxDF comprehensive guide
- [WCAG 2.2 Guidelines](https://www.accessibility.works/blog/wcag-2-2-guide/) - Web Content Accessibility Guidelines

---

## Sources

### Apple Wallet and Card UI Design
- [Wallet | Apple Developer Documentation](https://developer.apple.com/design/human-interface-guidelines/wallet)
- [Wallet Developer Guide: Pass Design and Creation](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Creating.html)
- [10 Card UI Design Examples That Actually Work in 2025](https://bricxlabs.com/blogs/card-ui-design-examples)

### Progressive Disclosure
- [What is Progressive Disclosure? — updated 2025 | IxDF](https://www.interaction-design.org/literature/topics/progressive-disclosure)
- [Progressive Disclosure design pattern](https://ui-patterns.com/patterns/ProgressiveDisclosure)
- [The Power of Progressive Disclosure in SaaS UX Design](https://lollypop.design/blog/2025/may/progressive-disclosure/)
- [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)

### Information Density
- [UI Density || Matt Ström-Awn, designer-leader](https://mattstromawn.com/writing/ui-density/)
- [17 Card UI Design Examples and Best Practices for Your Inspiration](https://www.eleken.co/blog-posts/card-ui-examples-and-best-practices-for-product-owners)
- [Card interface design: Tutorial, examples, and best practices - LogRocket Blog](https://blog.logrocket.com/ux-design/ui-card-design/)
- [Data Design Tips for Better UI Cards | by UX Movement | Medium](https://uxmovement.medium.com/data-design-tips-for-better-ui-cards-8d6a913df58d)

### Card Stack and Wallet Metaphors
- [Cards design pattern](https://ui-patterns.com/patterns/cards)
- [Beyond the Card UI Metaphor. The card UI metaphor has taken the… | by Eric Freeman | Medium](https://medium.com/@erictfree/beyond-the-card-ui-metaphor-6c2306b2ffeb)
- [Developer Blog: Card UI. Cardstack's composable design paradigm | by Cardstack Team | Cardstack | Medium](https://medium.com/cardstack/developer-blog-card-ui-da16a21e1908)

### Glassmorphism
- [Design Trends 2025: Glassmorphism, Neumorphism & Styles You Need to Know by Randall Carter](https://contra.com/p/PYkeMOc7-design-trends-2025-glassmorphism-neumorphism-and-styles-you-need-to-know)
- [What Is Glassmorphism? — updated 2025 | IxDF](https://www.interaction-design.org/literature/topics/glassmorphism)
- [Glassmorphism: Definition and Best Practices - NN/G](https://www.nngroup.com/articles/glassmorphism/)
- [Glassmorphism in 2025: How Apple's Liquid Glass is reshaping interface design](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/)

### Drag and Drop Patterns
- [Drag & Drop UX Design Best Practices - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop)
- [Designing drag and drop UIs: Best practices and patterns - LogRocket Blog](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/)
- [Drag-and-Drop UX: Guidelines and Best Practices — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)
- [Drag–and–Drop: How to Design for Ease of Use - NN/G](https://www.nngroup.com/articles/drag-drop/)

### Responsive Card Sizing
- [How to Create a Card Layout Using CSS Grid Layout](https://wpengine.com/resources/card-layout-css-grid-layout-how-to/)
- [Look Ma, No Media Queries! Responsive Layouts Using CSS Grid | CSS-Tricks](https://css-tricks.com/look-ma-no-media-queries-responsive-layouts-using-css-grid/)
- [CSS Grid: Responsive Cards without Media Query | by Yonas Fesehatsion | Medium](https://yonedesign.medium.com/css-grid-responsive-cards-without-media-query-2206722e8936)

### Accessibility
- [Card accessibility tests | U.S. Web Design System (USWDS)](https://designsystem.digital.gov/components/card/accessibility-tests/)
- [Accessible card UI component patterns | Digital Accessibility](https://dap.berkeley.edu/web-a11y-basics/accessible-card-ui-component-patterns)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [WCAG 2.2 Guide: Update to the Web Content Accessibility Guideline](https://www.accessibility.works/blog/wcag-2-2-guide/)

### Banking Apps and Payment Cards
- [The anatomy of a credit card form | by Gabriel Tomescu | UX Collective](https://uxdesign.cc/the-anatomy-of-a-credit-card-payment-form-32ec0e5708bb)
- [The Ultimate UX Design of: the Credit Card Payment Form](https://designmodo.com/ux-credit-card-payment-form/)

### Material Design and Elevation
- [Elevation & shadows - Material Design](https://m1.material.io/material-design/elevation-shadows.html)
- [Elevation – Material Design 3](https://m3.material.io/styles/elevation/applying-elevation)
- [Elevation Design Patterns: Tokens, Shadows, and Roles](https://designsystems.surf/articles/depth-with-purpose-how-elevation-adds-realism-and-hierarchy)

---
