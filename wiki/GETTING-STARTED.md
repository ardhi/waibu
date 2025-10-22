# Getting Started

> If you're new to the [Waibu Web Framework](https://ardhi.github.io/waibu), we recommend you to read and follow along with [Bajo Tutorial](https://ardhi.github.io/bajo/tutorial-01-getting-started.html) and [Dobo Tutorial](https://ardhi.github.io/dobo/tutorial-01-getting-started.html) first, as this document is the continuation of them

Bajo also has a sub-framework for serving the web called [Waibu](https://ardhi.github.io/waibu).

[Fastify](https://fastify.dev) and its ecosystem have been chosen as the web engine. Fastify is known to be one of the fastest, most solid, and robust web frameworks available for Node.js. Waibu wraps Fastify and its plugins to work like the Bajo plugin system and introduces several methods to make working with Fastify easier and more enjoyable.

To install Waibu and its dependencies, do this:

```bash
$ npm install waibu bajo-extra
```

and add ```waibu``` and ```bajo-extra``` to ```data/config/.plugins``` file.

By default, Waibu listens on host ```127.0.0.1``` and port ```7771```, so you can open your favorite browser and point it to the URL ```http://localhost:7771```.

A web framework is a very broad topic on its own. To make it more manageable, Waibu introduces the concept of a web app: a normal Bajo plugin that extends Waibu by providing a very specific task.

### Static Resources

The first web app to note is the one that serves static resources, [waibu-static](https://github.com/ardhi/waibu-static). Installation is very straightforward:

```
$ npm install waibu-static
```

and again, don't forget to add ```waibu-static``` to ```data/config/.plugins``` file.

#### Static Assets

This plugin serves static assets:
- With the route path ```/asset/{ns-prefix}/*```.
- Static assets are served from the ```{plugin-dir}/extend/waibuStatic/asset``` directory.
- Where ```{ns-prefix}``` is a prefix string defined by its corresponding plugin. If this prefix is missing, it defaults to the plugin's alias.
- And ```{plugin-dir}``` is the plugin's base directory.

Now, create the ```main/extend/waibuStatic/asset``` directory and add some static assets to it. For example, let's create ```main/extend/waibuStatic/asset/hello.txt``` and add some text in it.

When you restart your app, your screen should show you a bunch of logs like these:

```bash
$ node index.js --log-level=trace
...
2025-09-19T01:09:42.338Z +11ms INFO: waibu Server is ready
2025-09-19T01:09:42.346Z +8ms TRACE: waibu Loaded routes
2025-09-19T01:09:42.346Z +0ms TRACE: waibu - /asset* (OPTIONS)
2025-09-19T01:09:42.347Z +1ms TRACE: waibu - /asset/main/* (HEAD|GET)
2025-09-19T01:09:42.347Z +0ms TRACE: waibu - /asset/static/* (HEAD|GET)
2025-09-19T01:09:42.348Z +1ms TRACE: waibu - /asset/~/bajo/dayjs/* (HEAD|GET)
...

```

If you visit ```http://localhost:7771/asset/main/hello.txt```, you'll get the same exact content you just added.

#### Virtual Assets

In the app logs above, you might be wondering what route paths starting with ```/asset/~/{ns}``` are all about. In ```waibu-static``` terms, it's called virtual assets. It's a way to export any directory within a plugin to be served as static assets.

Imagine you're writing a plugin that needs a specific package called ```hybrid-pkg``` from npm, and your frontend needs the exact same package. Without virtual assets, you would have to copy the exported files or directory to your plugin's asset directory. With virtual assets, you only need to do the following:

1. Create ```{your-plugin-ns}/extend/waibuStatic/virtual.json```
2. Enter the following items into the file:
   ```json
   [{
     "prefix": "hybrid-pkg",
     "root": "node_modules/hybrid-pkg/dist"
   }]
   ```
   The above statement instructs virtual assets to create the route path ```/asset/~/{your-plugin-prefix}/hybrid-pkg/*``` that is mapped to ```{your-plugin-dir}/node_modules/hybrid-pkg/dist```
3. Restart your app

Now you can use the same resource for frontend. Your request will be in the form of ```http://localhost:7771/asset/~/{your-plugin-prefix}/hybrid-pkg/file.js```

