local limit_req = ngx.shared.rate_limit
local client_ip = ngx.var.remote_addr
local rate = 10  -- Max 10 requests per second

local req_count = limit_req:get(client_ip)

if req_count then
    if req_count > rate then
        ngx.exit(429)  -- Too Many Requests
    else
        limit_req:incr(client_ip, 1)
    end
else
    limit_req:set(client_ip, 1, 1)  -- Expire after 1 second
end