# Redis Setup and Troubleshooting Guide

## Problem: Redis Connection Errors

You're seeing these errors:
```
[Redis] Redis Client Error: Socket closed unexpectedly
[Redis] Redis Client Error: Connection timeout
```

This means **Redis is not running** or not accessible on your system.

## Understanding Redis in This Project

Redis is used for **caching** extracted data:
- **Resume extractions** are cached for 24 hours
- **JD extractions** are cached for 24 hours  
- **Match results** are cached for 12 hours

**Good news:** The application works WITHOUT Redis - it just won't cache results, so:
- ✅ Extractions will still work
- ✅ API calls will succeed
- ⚠️ Each request will call Groq API (slower, uses more quota)
- ⚠️ No performance benefit from caching

## Solution Options

### Option 1: Run Without Redis (Quick Fix)

**If you don't need caching**, you can simply ignore the Redis errors. The app will:
- Process every request fresh (no cache)
- Work normally but slower
- Use more API quota

**No action needed** - the errors are warnings, not fatal.

---

### Option 2: Install and Run Redis (Recommended)

#### For Windows (Your System)

**Method A: Using Windows Subsystem for Linux (WSL) - RECOMMENDED**

1. **Install WSL** (if not already installed):
   ```powershell
   wsl --install
   ```
   Restart your computer after installation.

2. **Install Redis in WSL:**
   ```bash
   # Open WSL terminal
   wsl
   
   # Update packages
   sudo apt update
   
   # Install Redis
   sudo apt install redis-server -y
   
   # Start Redis
   sudo service redis-server start
   
   # Verify Redis is running
   redis-cli ping
   # Should return: PONG
   ```

3. **Auto-start Redis on WSL startup:**
   ```bash
   # Edit WSL config
   sudo nano /etc/wsl.conf
   
   # Add these lines:
   [boot]
   command="service redis-server start"
   
   # Save and exit (Ctrl+X, Y, Enter)
   ```

4. **Keep WSL running in background:**
   - WSL must be running for Redis to work
   - Open a WSL terminal and minimize it
   - Or run: `wsl -- redis-server --daemonize yes`

**Method B: Using Memurai (Native Windows)**

1. **Download Memurai** (Redis-compatible for Windows):
   - Visit: https://www.memurai.com/
   - Download Memurai Developer Edition (FREE)

2. **Install Memurai:**
   - Run the installer
   - Use default settings
   - It will run as a Windows service

3. **Verify installation:**
   ```powershell
   # Install redis-cli for Windows (optional)
   # Or use Memurai CLI
   memurai-cli ping
   # Should return: PONG
   ```

4. **Update your `.env` file** (if using different port):
   ```env
   REDIS_URL=redis://localhost:6379
   ```

**Method C: Docker (Alternative)**

1. **Install Docker Desktop for Windows:**
   - Download from: https://www.docker.com/products/docker-desktop/

2. **Run Redis container:**
   ```powershell
   docker run -d -p 6379:6379 --name redis redis:alpine
   ```

3. **Verify Redis is running:**
   ```powershell
   docker exec -it redis redis-cli ping
   # Should return: PONG
   ```

4. **Auto-start on boot:**
   ```powershell
   docker update --restart unless-stopped redis
   ```

---

#### For macOS

```bash
# Install via Homebrew
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping
# Should return: PONG
```

---

#### For Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Fedora/RHEL
sudo dnf install redis -y
sudo systemctl start redis
sudo systemctl enable redis

# Verify
redis-cli ping
# Should return: PONG
```

---

### Option 3: Use Cloud Redis (Alternative)

If local installation is difficult, use a free cloud Redis service:

**Redis Cloud (FREE tier available):**

1. Sign up at: https://redis.com/try-free/
2. Create a free database
3. Copy the connection URL
4. Update `.env`:
   ```env
   REDIS_URL=redis://username:password@redis-12345.cloud.redislabs.com:12345
   ```

**Upstash (FREE tier available):**

1. Sign up at: https://upstash.com/
2. Create a Redis database
3. Copy the connection URL
4. Update `.env`:
   ```env
   REDIS_URL=redis://default:password@endpoint.upstash.io:6379
   ```

---

## Verify Redis Connection

After setting up Redis, test the connection:

### 1. Check Redis is Running

```bash
redis-cli ping
```

Expected output: `PONG`

### 2. Test from Your Application

Create a test file `testRedis.ts`:

```typescript
import { initializeRedisClient, setCache, getCache } from './utils/redisClient';

async function testRedis() {
  console.log('Testing Redis connection...');
  
  await initializeRedisClient();
  
  // Test set
  await setCache('test_key', { message: 'Hello Redis!' }, 60);
  console.log('✓ Set test data');
  
  // Test get
  const result = await getCache('test_key');
  console.log('✓ Retrieved:', result);
  
  if (result && result.message === 'Hello Redis!') {
    console.log('✓ Redis is working correctly!');
  } else {
    console.log('✗ Redis test failed');
  }
}

testRedis().catch(console.error);
```

Run:
```bash
bun run testRedis.ts
```

Expected output:
```
[Redis] Connected to Redis successfully
Testing Redis connection...
✓ Set test data
✓ Retrieved: { message: 'Hello Redis!' }
✓ Redis is working correctly!
```

### 3. Check Cache Status

```bash
npm run cache-status
```

This shows how many items are cached.

---

## Troubleshooting

### Issue: "Connection timeout" or "Socket closed unexpectedly"

**Causes:**
- Redis is not running
- Wrong connection URL
- Firewall blocking connection
- Redis port already in use

**Solutions:**

1. **Check if Redis is running:**
   ```bash
   # Windows (WSL)
   wsl -- sudo service redis-server status
   
   # Windows (Memurai)
   Get-Service Memurai
   
   # macOS
   brew services list | grep redis
   
   # Linux
   sudo systemctl status redis-server
   ```

2. **Restart Redis:**
   ```bash
   # Windows (WSL)
   wsl -- sudo service redis-server restart
   
   # Windows (Memurai)
   Restart-Service Memurai
   
   # macOS
   brew services restart redis
   
   # Linux
   sudo systemctl restart redis-server
   ```

3. **Check Redis port:**
   ```bash
   # Windows
   netstat -an | findstr 6379
   
   # macOS/Linux
   netstat -an | grep 6379
   ```
   
   Should show: `127.0.0.1:6379` in LISTENING state

4. **Test connection manually:**
   ```bash
   redis-cli -h localhost -p 6379 ping
   ```

5. **Check `.env` configuration:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

### Issue: Redis works in terminal but not in app

**Solution:**
- Ensure Redis is running when you start your app
- Check the `REDIS_URL` in `.env` matches your Redis setup
- Try restarting your application

### Issue: WSL Redis not accessible from Windows

**Solution:**
```bash
# In WSL, edit Redis config
sudo nano /etc/redis/redis.conf

# Find and change:
bind 127.0.0.1 ::1
# to:
bind 0.0.0.0

# Restart Redis
sudo service redis-server restart
```

Then in `.env`:
```env
REDIS_URL=redis://localhost:6379
```

---

## Performance Impact

### With Redis (Recommended):
- ✅ First extraction: ~2-5 seconds (Groq API call)
- ✅ Subsequent extractions: ~50ms (cached)
- ✅ Saves API quota
- ✅ Faster response times

### Without Redis:
- ⚠️ Every extraction: ~2-5 seconds (fresh API call)
- ⚠️ Uses more API quota
- ⚠️ Slower overall performance
- ⚠️ More load on Groq API

## Recommended Setup for Windows

**For your Windows 24H2 system, I recommend:**

1. **Install WSL 2** (if not installed)
2. **Install Redis in WSL**
3. **Auto-start Redis** with WSL
4. **Keep WSL running** in background

This provides:
- Native Redis performance
- Easy management
- Good integration with Windows
- No additional software needed

---

## Quick Start Commands

### Start Redis (Windows WSL):
```bash
wsl -- sudo service redis-server start
```

### Check Redis Status:
```bash
wsl -- sudo service redis-server status
```

### Test Connection:
```bash
wsl -- redis-cli ping
```

### View Cached Data:
```bash
npm run cache-status
```

### Clear Cache:
```bash
npm run clear-cache
```

---

## Environment Configuration

Create or update `.env`:

```env
# Required
GROQ_API_KEYS=your-api-key-here

# Optional - Redis Configuration
REDIS_URL=redis://localhost:6379

# Optional - Model Configuration
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

---

## Next Steps

After setting up Redis:

1. **Start Redis** (using one of the methods above)
2. **Verify connection:** `redis-cli ping`
3. **Restart your application:** `bun run dev`
4. **Check logs** - should see: `[Redis] Connected to Redis successfully`
5. **Test extraction** with a sample PDF
6. **Run again** - should be much faster (cached)

---

## Support

If you continue to see Redis errors:

1. **Try Option 1** (run without Redis) - it still works!
2. **Share the output** of:
   - `redis-cli ping`
   - `npm run cache-status`
   - Your `.env` file (hide API keys)
3. **Check if another service** is using port 6379

---

**Remember:** The application works fine without Redis - you just won't get caching benefits. Focus on getting your extractions working first, then set up Redis for better performance later.
