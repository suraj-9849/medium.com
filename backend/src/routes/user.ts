import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from "hono";
import bcrypt from 'bcryptjs';
import {sign} from 'hono/jwt'

export const userRouter = new Hono<{
    Bindings:{
         DATABASE_URL:string
    } ,
    Variables: {
        userId: string 
      }
}>
()

userRouter.post("/signup", async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    interface User{
      email:string,
      name:string,
      password:string
    }
    const {email,name,password}:User = await c.req.json();
    if(!email||!name||!password){
      return c.json({
        msg:"Input Error"
      })
    }
    let UserExists = await prisma.user.findUnique({
      where:{
        email
      }
    })
    if(UserExists){
      return c.json({
        msg:"User Already Exists! with the same Email"
      })
    }
    var salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password, salt);
   const UserDetails =  await prisma.user.create({
      data:{
        email,
        name,
        password:hashedPassword
      }
    })
  
    const token =await sign({id:UserDetails.id},"secret")
    return c.json({
      msg:`JWT Token : ${token}`,
      statusbar:200
    })
  });
  userRouter.post("/signin", async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const {email,password} = await c.req.json()
    const UserSignIn = await prisma.user.findUnique({
      where:{
        email,
        password
      }
    })
    if(!UserSignIn){
      c.status(403)
      return c.json({err:"user not found"})
    }
    const jwt = await sign({id:UserSignIn.id},"secret")
    return c.json({
      jwt
    })
  });