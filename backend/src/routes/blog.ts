import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    authorId: number;
    limit: number;
    page: number;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.split(" ")[1];
  try {
    const user = await verify(token, "secretSuraj");
    console.log(token);
    if (user) {
      c.set("authorId", user.id as number);
      console.log("Logged In");
      await next();
    } else {
      c.status(403);
      return c.json({
        message: "You are not logged in",
      });
    }
  } catch (e) {
    c.status(403);
    return c.json({
      message: "You are not logged in",
    });
  }
});

blogRouter.get("/test", async (c) => {
  return c.text("This is a test route!");
});

blogRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const authorId = c.get("authorId");

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: authorId,
      },
    });

    return c.json({
      msg: "Post added Successfully!",
      blog,
      status: 200,
    });
  } catch (error: any) {
    console.error("Error creating blog:", error);
    return c.json({
      msg: "Failed to add post",
      error: (error.message as Error) || "An error occurred",
      status: 500,
    });
  }
});

blogRouter.put("/", async (c) => {
  const body = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blog = await prisma.blog.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return c.json({
    msg: "Post added SuccessFully!",
  });
});

blogRouter.get("/allPosts", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  //Pagination - Has Been Added
  let limit = parseInt(c.req.query("limit") as string ) || 10;
  let page = parseInt(c.req.query("page")as string) || 1;
  limit = Math.max(1, limit);
  page = Math.max(1, page);
  const skip = (page - 1) * limit;
  const blogs = await prisma.blog.findMany({
    skip,
    take: limit,
  });
  const totalBlogs = await prisma.blog.count();

  return c.json({
    blogs,
    totalBlogs,
    currentPage: page,
    totalPages: Math.ceil(totalBlogs / limit),
  });
});

blogRouter.get("/", async (c) => {
    const id = c.req.param("id")
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.findFirst({
    where: {
        id:Number(id)
    },
  });

  return c.json({
    blog
  });
});
blogRouter.get("/", async (c) => {
  const body = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.findFirst({
    where: {
      id: body.id,
    },
  });

  return c.json({
    blog,
  });
});
