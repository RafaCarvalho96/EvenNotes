> evennotes@0.1.0 docker:up C:\Users\MICRO\Desktop\EvenNotes        
> docker compose -f infra/docker/compose.yml up --watch

[+] Building 15.7s (41/41) FINISHED
 => [internal] load local bake definitions                     0.0s 
 => => reading from stdin 729B                                 0.0s
 => [web internal] load build definition from web.Dockerfile   0.0s
 => => transferring dockerfile: 3.55kB                         0.0s 
 => [api internal] load build definition from api.Dockerfile   0.0s 
 => => transferring dockerfile: 3.43kB                         0.0s 
 => [api] resolve image config for docker-image://docker.io/d  0.6s
 => CACHED [web] docker-image://docker.io/docker/dockerfile:1  0.0s 
 => [api internal] load metadata for docker.io/library/node:2  0.5s 
 => [api internal] load .dockerignore                          0.0s 
 => => transferring context: 493B                              0.0s 
 => [api internal] load build context                          0.0s 
 => => transferring context: 16.44kB                           0.0s 
 => [web base  1/16] FROM docker.io/library/node:24-alpine@sh  0.0s 
 => CACHED [web base  2/16] RUN corepack enable && corepack p  0.0s 
 => CACHED [web base  3/16] WORKDIR /app                       0.0s 
 => [web base  4/16] COPY package.json pnpm-lock.yaml pnpm-wo  0.0s 
 => [web base  5/15] COPY apps/web/package.json ./apps/web/pa  0.1s 
 => [api base  5/16] COPY apps/api/package.json ./apps/api/pa  0.1s 
 => [web base  6/15] COPY packages/ai-core/package.json ./pac  0.1s 
 => [api base  6/16] COPY apps/cli/package.json ./apps/cli/pa  0.1s 
 => [web base  7/15] COPY packages/ai-pipelines/package.json   0.1s 
 => [api base  7/16] COPY packages/ai-core/package.json ./pac  0.1s 
 => [web base  8/15] COPY packages/contracts/package.json ./p  0.1s 
 => [api base  8/16] COPY packages/ai-pipelines/package.json   0.1s 
 => [web base  9/15] COPY packages/markdown-core/package.json  0.1s 
 => [api base  9/16] COPY packages/contracts/package.json ./p  0.1s 
 => [web base 10/15] COPY packages/observability/package.json  0.1s 
 => [api base 10/16] COPY packages/markdown-core/package.json  0.1s 
 => [web base 11/15] COPY packages/prompts/package.json ./pac  0.1s 
 => [api base 11/16] COPY packages/observability/package.json  0.1s 
 => [web base 12/15] COPY packages/test-utils/package.json ./  0.1s 
 => [api base 12/16] COPY packages/prompts/package.json ./pac  0.1s 
 => [web base 13/15] COPY packages/ui/package.json ./packages  0.1s 
 => [api base 13/16] COPY packages/test-utils/package.json ./  0.1s 
 => [web base 14/15] COPY packages/workspace-core/package.jso  0.1s 
 => [api base 14/16] COPY packages/ui/package.json ./packages  0.0s 
 => [web base 15/15] RUN --mount=type=cache,id=pnpm-store,tar  8.5s 
 => [api base 15/16] COPY packages/workspace-core/package.jso  0.1s 
 => [api base 16/16] RUN --mount=type=cache,id=pnpm-store,tar  8.3s 
 => [api dev 1/1] COPY . .                                     0.1s 
 => [api] exporting to image                                   4.0s 
 => => exporting layers                                        4.0s 
 => => writing image sha256:2b4fea00b494e4317e93724b4153d3ccd  0.0s 
 => => naming to docker.io/library/docker-api                  0.0s 
 => [web dev 1/1] COPY . .                                     0.2s 
 => [web] exporting to image                                   3.5s 
 => => exporting layers                                        3.5s 
 => => writing image sha256:7d2434b41d5b96e1a93ea7960e4f7bfb2  0.0s 
 => => naming to docker.io/library/docker-web                  0.0s 
 => [web] resolving provenance for metadata file               0.0s 
 => [api] resolving provenance for metadata file               0.0s 
[+] Running 6/6
 ✔ api                             Built                       0.0s 
 ✔ web                             Built                       0.0s 
 ✔ Network docker_default          Created                     0.1s 
 ✔ Volume "docker_workspace_data"  Created                     0.0s 
 ✔ Container docker-api-1          Created                     0.1s 
 ✔ Container docker-web-1          Created                     0.1s 
time="2026-03-01T05:23:19-03:00" level=warning msg="path 'C:\\Users\\MICRO\\Desktop\\EvenNotes\\apps\\api\\src' also declared by a bind mount volume, this path won't be monitored!\n"
time="2026-03-01T05:23:19-03:00" level=warning msg="path 'C:\\Users\\MICRO\\Desktop\\EvenNotes\\apps\\web\\src' also declared by a bind mount volume, this path won't be monitored!\n"
        ⦿ Watch enabled
Attaching to api-1, web-1
api-1   | node:internal/modules/cjs/loader:1459
api-1   |   throw err;
api-1   |   ^                                                       
api-1   |                                                           
api-1   | Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'                                                       
api-1   |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)                                                     
api-1   |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)                                                          
api-1   |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)                                                      
api-1   |     at Module._load (node:internal/modules/cjs/loader:1242:25)                                                                
api-1   |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)                                                               
api-1   |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)                                       
api-1   |     at node:internal/main/run_main_module:33:47 {
api-1   |   code: 'MODULE_NOT_FOUND',                               
api-1   |   requireStack: []                                        
api-1   | }                                                         
api-1   |                                                           
api-1   | Node.js v24.14.0                                          
api-1   | undefined                                                 
api-1   | /app/apps/api:
api-1   |  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx watch src/index.ts                                  
api-1 exited with code 0
api-1   | node:internal/modules/cjs/loader:1459
api-1   |   throw err;
api-1   |   ^                                                       
api-1   |                                                           
api-1   | Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'                                                       
api-1   |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)                                                     
api-1   |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)                                                          
api-1   |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)                                                      
api-1   |     at Module._load (node:internal/modules/cjs/loader:1242:25)                                                                
api-1   |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)                                                               
api-1   |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)                                       
api-1   |     at node:internal/main/run_main_module:33:47 {
api-1   |   code: 'MODULE_NOT_FOUND',                               
api-1   |   requireStack: []                                        
api-1   | }                                                         
api-1   |                                                           
api-1   | Node.js v24.14.0                                          
api-1   | undefined                                                 
api-1   | /app/apps/api:                                            
api-1   |  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx watch src/index.ts                                  
api-1 exited with code 0
api-1   | node:internal/modules/cjs/loader:1459
api-1   |   throw err;
api-1   |   ^                                                       
api-1   |                                                           
api-1   | Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'                                                       
api-1   |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)                                                     
api-1   |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)                                                          
api-1   |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)                                                      
api-1   |     at Module._load (node:internal/modules/cjs/loader:1242:25)                                                                
api-1   |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)                                                               
api-1   |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)                                       
api-1   |     at node:internal/main/run_main_module:33:47 {
api-1   |   code: 'MODULE_NOT_FOUND',                               
api-1   |   requireStack: []
api-1   | }                                                         
api-1   |                                                           
api-1   | Node.js v24.14.0                                          
api-1   | undefined                                                 
api-1   | /app/apps/api:                                            
api-1   |  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx watch src/index.ts                                  
api-1 exited with code 1
api-1   | node:internal/modules/cjs/loader:1459
api-1   |   throw err;
api-1   |   ^                                                       
api-1   |                                                           
api-1   | Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'                                                       
api-1   |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)                                                     
api-1   |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)                                                          
api-1   |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)                                                      
api-1   |     at Module._load (node:internal/modules/cjs/loader:1242:25)                                                                
api-1   |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)                                                               
api-1   |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)                                       
api-1   |     at node:internal/main/run_main_module:33:47 {
api-1   |   code: 'MODULE_NOT_FOUND',                               
api-1   |   requireStack: []                                        
api-1   | }
api-1   |                                                           
api-1   | Node.js v24.14.0                                          
api-1   | undefined                                                 
api-1   | /app/apps/api:                                            
api-1   |  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx watch src/index.ts                                  
api-1 exited with code 1
api-1   | node:internal/modules/cjs/loader:1459
api-1   |   throw err;
api-1   |   ^                                                       
api-1   |                                                           
api-1   | Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'                                                       
api-1   |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)                                                     
api-1   |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)                                                          
api-1   |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)                                                      
api-1   |     at Module._load (node:internal/modules/cjs/loader:1242:25)                                                                
api-1   |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)                                                               
api-1   |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)                                       
api-1   |     at node:internal/main/run_main_module:33:47 {
api-1   |   code: 'MODULE_NOT_FOUND',                               
api-1   |   requireStack: []                                        
api-1   | }                                                         
api-1   |                                                           
api-1   | Node.js v24.14.0                                          
api-1   | undefined                                                 
api-1   | /app/apps/api:                                            
api-1   |  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx watch src/index.ts                                  
api-1 exited with code 1
api-1   | node:internal/modules/cjs/loader:1459
api-1   |   throw err;
api-1   |   ^                                                       
api-1   |                                                           
api-1   | Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'                                                       
api-1   |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)                                                     
api-1   |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)                                                          
api-1   |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)                                                      
api-1   |     at Module._load (node:internal/modules/cjs/loader:1242:25)                                                                
api-1   |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)                                                               
api-1   |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)                                       
api-1   |     at node:internal/main/run_main_module:33:47 {
api-1   |   code: 'MODULE_NOT_FOUND',                               
api-1   |   requireStack: []                                        
api-1   | }                                                         
api-1   |                                                           
api-1   | Node.js v24.14.0                                          
api-1   | undefined                                                 
api-1   | /app/apps/api:                                            
api-1   |  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx watch src/index.ts                                  
api-1 exited with code 1
api-1   | node:internal/modules/cjs/loader:1459
api-1   |   throw err;
api-1   |   ^                                                       
api-1   |                                                           
api-1   | Error: Cannot find module '/app/apps/api/node_modules/tsx/dist/cli.mjs'                                                       
api-1   |     at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)                                                     
api-1   |     at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)                                                          
api-1   |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)                                                      
api-1   |     at Module._load (node:internal/modules/cjs/loader:1242:25)                                                                
api-1   |     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)                                                               
api-1   |     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
api-1   |     at node:internal/main/run_main_module:33:47 {
api-1   |   code: 'MODULE_NOT_FOUND',                               
api-1   |   requireStack: []                                        
api-1   | }                                                         
api-1   | Node.js v24.14.0
api-1   | undefined
api-1   | /app/apps/api:
api-1   |  ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1: tsx watch src/index.ts
api-1 exited with code 1
Gracefully stopping... (press Ctrl+C again to force)
dependency failed to start: container docker-api-1 is unhealthy
 ELIFECYCLE  Command failed with exit code 1.