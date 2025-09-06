import { createAudiotoolClient } from "@audiotool/nexus"

console.debug("initializing")
const client = await createAudiotoolClient({})
const user = await client.api.userService.getUser({})
console.debug("user", user)   
console.debug("initialized")