# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Skip to content" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e6]:
    - img "itemdeck logo" [ref=e7]
    - heading "itemdeck" [level=1] [ref=e8]
    - paragraph [ref=e9]: Select a collection to view
    - generic [ref=e11]:
      - text: GitHub Username
      - generic [ref=e12]:
        - textbox "GitHub Username Scan" [ref=e13]:
          - /placeholder: Enter GitHub username
          - text: REPPL
        - button "Scan" [disabled] [ref=e14]
    - generic [ref=e15]:
      - paragraph [ref=e16]: GitHub API rate limit exceeded. Try again later.
      - button "Retry" [ref=e17] [cursor=pointer]
    - button "DEV Load Example Collections" [ref=e19] [cursor=pointer]:
      - generic [ref=e20]: DEV
      - generic [ref=e21]: Load Example Collections
      - img [ref=e22]
  - complementary:
    - navigation
  - main [ref=e24]:
    - generic [ref=e25]:
      - button "Minimise search bar" [ref=e28] [cursor=pointer]:
        - img [ref=e29]
      - generic [ref=e34]:
        - generic [ref=e35]:
          - generic:
            - img
          - textbox "Search cards" [ref=e36]:
            - /placeholder: Search... (AND, OR, NOT, -exclude)
        - button "Search all cards" [ref=e37] [cursor=pointer]: All
    - alert [ref=e39]: "Error: Invalid content type for collection definition: text/html"
```