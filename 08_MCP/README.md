<p align="center" draggable="false"><img src="https://github.com/AI-Maker-Space/LLM-Dev-101/assets/37101144/d1343317-fa2f-41e1-8af1-1dbb18399719"
     width="200px"
     height="auto"/>
</p>

<h1 align="center" id="heading">Session 8: Model Context Protocol (MCP)</h1>

### [Quicklinks]()

| Session Sheet | Recording | Slides | Repo | Homework | Feedback |
|:--------------|:----------|:-------|:-----|:---------|:---------|
| [Session 8: MCP](https://github.com/AI-Maker-Space/The-AI-Engineering-Certification-v1.0/tree/main/00_Docs/Modules/08_MCP) |[Recording!](https://us02web.zoom.us/rec/share/rqw5I5hwbOOHy8TrGjnu0IjDJi53ykHb0k897jYfyHqZpgRhUuFP4A18d4NrcEKS.18sNk6Do9XwyaVUy) <br> passcode: `E56&^V+8`| [Session 8 Slides](https://canva.link/k8cixqgkfeghdsn) |You are here! | [Session 8 Assignment](https://forms.gle/TcjjChq38ydMjuqn8) | [Feedback 6/25](https://forms.gle/DvcWDgBXatBWCXqi7) |

## Useful Resources

**MCP (Model Context Protocol)**
- [MCP Official Docs](https://modelcontextprotocol.io/) — Spec, tutorials, and guides
- [MCP-UI](https://mcpui.dev/) — Official standard for interactive UI in MCP
- [MCP Auth Guide (Auth0)](https://auth0.com/blog/mcp-specs-update-all-about-auth/) — Deep dive into MCP auth spec updates

## Main Assignment

In this session, you will build an MCP server with OAuth authentication — a cat
shop application that exposes tools for browsing products, managing a cart, and
checking out.

The main entry point is:

```text
server.py
```

The server implementation lives in:

```text
app/
```

Available MCP tools:

- `list_products`
- `get_product`
- `add_to_cart`
- `view_cart`
- `remove_from_cart`
- `checkout`

## Setup

From this folder:

```bash
uv sync
```

Copy the example env file and fill in your OpenAI API key:

```bash
cp .env.example .env
```

## Running the MCP Server

Run the server locally:

```bash
uv run server.py
```

The server starts on `http://localhost:8000`.

### Expose the server with ngrok

In a separate terminal, start an ngrok tunnel:

```bash
ngrok http 8000
```

Copy the ngrok forwarding URL (e.g. `https://xxxx-xx-xx-xx-xx.ngrok-free.app`) and
restart the server with it:

```bash
ISSUER_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app uv run server.py
```

> **Note:** The `ISSUER_URL` must match the public URL clients use to reach the
> server, otherwise OAuth authentication will fail.

## Outline

### Breakout Room #1

- Set up the MCP server with OAuth and the product database
- Explore the MCP tools: `list_products`, `get_product`, `add_to_cart`, `view_cart`, `remove_from_cart`, `checkout`

### Breakout Room #2

- Connect an MCP client to the server
- Build an end-to-end interaction flow using the MCP tools

## Ship

The completed MCP server and client integration!

### Deliverables

- A short Loom of either:
  - the MCP server you built and a demo of the client interacting with it; or
  - the notebook you created for the Advanced Build

## Share

Make a social media post about your final application!

### Deliverables

- Make a post on any social media platform about what you built!

Here's a template to get you started:

```
🚀 Exciting News! 🚀

I am thrilled to announce that I have just built and shipped an MCP server with OAuth authentication! 🎉🤖

🔍 Three Key Takeaways:
1️⃣
2️⃣
3️⃣

Let's continue pushing the boundaries of what's possible in the world of AI and tool integration. Here's to many more innovations! 🚀
Shout out to @AIMakerspace !

#MCP #ModelContextProtocol #OAuth #Innovation #AI #TechMilestone

Feel free to reach out if you're curious or would like to collaborate on similar projects! 🤝🔥
```

## Submitting Your Homework 

Follow these steps to prepare and submit your homework assignment:

1. Review the MCP server code in `server.py` and the `app/` directory
2. Run the MCP server locally using `uv run server.py`
3. Connect to the server using an MCP client (e.g., Claude Desktop, or a custom client)
4. Test all available tools: browsing products, adding to cart, viewing cart, removing items, and checkout
5. Record a Loom video reviewing what you have learned from this session

## Questions

### Question #1

Why is OAuth important for MCP servers, and what security considerations should you keep in mind when exposing tools to AI clients?

#### Answer

OAuth matters because MCP tools act on the user's behalf — checkout and add_to_cart change real state, so the server must know who's calling without ever holding the user's password. OAuth issues a scoped, expiring, revocable token tied to a user, which is why checkout requires auth (via _get_username()) while read-only tools like list_products don't.

Key things to keep in mind when exposing tools to AI clients:

Least privilege — grant only the scopes a tool needs.
Short-lived, revocable tokens — limit the damage from a leak.
Treat the AI as untrusted — it can be prompt-injected, so scoped auth caps what a tricked agent can do.
Use HTTPS so tokens aren't exposed in transit.

### Question #2

What is Streamable HTTP transport in MCP, and why might you expose a server publicly with OAuth instead of using a local stdio connection?

#### Answer

Streamable HTTP is MCP's network transport: the server runs as a standalone HTTP service (here, mcp.run(transport="streamable-http") on /mcp) that clients reach over the network, with the ability to stream responses back incrementally. stdio, by contrast, runs the server as a local subprocess talking over stdin/stdout — local, single-client, no network, no auth.

You'd expose a server publicly with OAuth instead of stdio when it isn't on the same machine as the client, serves multiple users, or needs real authentication and per-user isolation (e.g. keeping each user's cart separate). stdio's security model is "trust because we're on the same machine" — once the server is reachable over a network, that's gone, so OAuth replaces it with scoped, revocable tokens. The ngrok step makes this concrete: the moment your localhost server gets a public URL, auth stops being optional.

## Activity 1: Extend the MCP Server

Add at least one new tool to the cat shop MCP server (e.g., `search_products`, `update_cart_quantity`, or `get_order_history`). Ensure the new tool integrates properly with the existing database and OAuth authentication. Demo the new tool through an MCP client and include it in your Loom video.

#### Solution

Added a new `search_product` tool in [`app/tools.py`](app/tools.py). It searches the
catalog by matching a query against product `name` or `description` using a SQL
`LIKE '%query%'` filter, and returns the matching products (an empty list if none
match).

```python
@mcp.tool()
async def search_product(product_name: str) -> list[dict]:
    """Search the catalog for products whose name or description matches a query. Returns an empty list if nothing matches."""
    db = await oauth_provider._get_db()
    cursor = await db.execute(
        "SELECT id, name, description, price, category FROM products WHERE name LIKE ? OR description LIKE ?",
        (f"%{product_name}%", f"%{product_name}%"),
    )
    rows = await cursor.fetchall()
    return [
        {"id": r[0], "name": r[1], "description": r[2], "price": r[3], "category": r[4]}
        for r in rows
    ]
```

It integrates with the existing setup the same way the built-in tools do: it is
registered with `@mcp.tool()` (so it's auto-discovered by MCP clients) and reads
from the shared product database via `oauth_provider._get_db()`. Like the other
read-only catalog tools (`list_products`, `get_product`), it does not gate on
`_get_username()` — only cart/checkout tools require an authenticated user — so it
still runs behind the same OAuth-protected `/mcp` endpoint as every other tool.

## Advanced Activity: Build a Custom MCP Client

Build a custom MCP client that connects to the cat shop server over Streamable HTTP, authenticates via OAuth, and orchestrates a multi-step shopping flow (browse → add to cart → checkout). Compare the developer experience of MCP-based tool integration vs. traditional REST API calls.

Include your findings and a demo in your Loom video.
