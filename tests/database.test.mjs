import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
after(async()=>{await pool.end();});

test("domain tables exist",async()=>{
  const expected=["users","households","household_members","household_invites",
    "items","item_photos","packages","package_items","transfers","item_events","connections","notifications"];
  for(const name of expected){
    const result=await pool.query("SELECT to_regclass($1) AS id",["public."+name]);
    assert.equal(result.rows[0].id,name,"missing table: "+name);
  }
});
test("oidc issuer and subject form a unique identity",async()=>{
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const id=randomUUID(), subject=randomUUID();
    await client.query("INSERT INTO users (id,oidc_issuer,oidc_subject,display_name) VALUES ($1,$2,$3,$4)",
      [id,"https://auth.example.org",subject,"Smoke Test"]);
    await assert.rejects(client.query(
      "INSERT INTO users (id,oidc_issuer,oidc_subject,display_name) VALUES ($1,$2,$3,$4)",
      [randomUUID(),"https://auth.example.org",subject,"Duplicate"]),
      (e)=>e.code==="23505");
  }finally{await client.query("ROLLBACK");client.release();}
});
test("household membership requires existing user and household",async()=>{
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await assert.rejects(client.query(
      "INSERT INTO household_members (user_id,household_id,role) VALUES ($1,$2,$3)",
      [randomUUID(),randomUUID(),"member"]),
      (e)=>e.code==="23503");
  }finally{await client.query("ROLLBACK");client.release();}
});
test("loan and contact metadata are present",async()=>{
  const result=await pool.query(
    "SELECT table_name,column_name FROM information_schema.columns WHERE (table_name='transfers' AND column_name='returned_at') OR (table_name='connections' AND column_name='requested_by_household_id')");
  assert.equal(result.rowCount,2);
});
