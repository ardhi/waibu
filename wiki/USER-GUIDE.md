# User Guide

### locals object

The `locals` object contains local variables that are available within the scope of the current template. These variables can be used to store temporary data, perform calculations, or pass information between different parts of the template.

Example usage:

```html
<% locals.myVariable = "Hello, World!"; %>
<p><%= locals.myVariable %></p>
```

- page
  - title
- sidebar
- menu
  - homes: contains the home menu items
  - pages: contains the pages menu items
- _meta
  - params: contains all req (request) parameters
  - query: contains all query string parameters
  - site: contains site-wide information and settings
  - user: contains information about the currently logged-in user
  - theme: contains information about the current theme settings
  - iconset: contains information about the current icon set
  - routeOpts: contains options related to the current route (fastify's routeOptions object)
  - env: contains environment-specific info that passed to the application
  - url: contains information about the current request URL (only the path)
  - prevUrl: contains information about the previous request URL (only available if session is activated)
  - reqId: contains the unique identifier for the current request
  - flash: contains flash messages for the current request
