# Framework Source Analysis Setup

## Clone Commands

```bash
# Create analysis directory
cd /home/pallab/Personal/make-library
mkdir -p analysis

# Clone React
git clone https://github.com/facebook/react.git analysis/react-source

# Clone Express
git clone https://github.com/expressjs/express.git analysis/express-source

# Clone NestJS
git clone https://github.com/nestjs/nest.git analysis/nest-source

# Clone Fastify
git clone https://github.com/fastify/fastify.git analysis/fastify-source

# Clone Hono
git clone https://github.com/honojs/hono.git analysis/hono-source
```

## Repository URLs

- React: https://github.com/facebook/react
- Express: https://github.com/expressjs/express
- NestJS: https://github.com/nestjs/nest
- Fastify: https://github.com/fastify/fastify
- Hono: https://github.com/honojs/hono

## Analysis Directories

```
/analysis
├── react-source/     # React source code
├── express-source/   # Express.js source code
├── nest-source/      # Nest.js source code
├── fastify-source/   # Fastify source code
└── hono-source/      # Hono source code
```

## Post-Clone Setup

Run the following for each source:

```bash
cd analysis/<framework>-source
npm install
```
