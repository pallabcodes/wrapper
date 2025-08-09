Extract everything that could be extracted from the source-code of fastify i.e. at #fastify-source i.e. 

a. either unviersally repurposesalbe eleshwere or I can use native implmenation and customize it to fit my project's usecase e.g. I want to do somthing with autoloader or I might take a native feture tweak or create wrapper or modify as needed for better or simpler etc.

b. advnaced typescript stuff


GOAL: is to use `fastify` than even the creator himslef didn't quite expect or explore so for that I need to know nitty-gritty of it


Again, extract everything that should be extracted and I will REPEAT again whatever you are extracting either it should be universally re-purposable or should help me to customize/modify/extend/wrap etc as need

# Requirements

# Requirements: Enterprise Laravel E-commerce Architecture

## Business Context
Our company specializes in enterprise e-commerce solutions serving:
- **Large Scale**: Shopify/Amazon-level platforms (1M+ customers, 50K+ concurrent users)
- **Mid Scale**: Growing businesses (10K customers, 100-1K concurrent users)

## Core E-commerce Features (Scale-Agnostic)
- Real-time chat system
- Inventory & warehouse management
- Email/notification system
- Shipping & logistics
- Order management
- Flash sales & high-traffic events
- Multi-vendor seller accounts
- Customer account management
- Role-based access control
- Payment gateway integrations

## Technical Challenges
- **Database**: Distributed architecture decisions
- **Read Performance**: Optimized for sales events and flash sales
- **Write Performance**: Fault-tolerant, high-speed transaction processing
- **Security**: Multi-tier account security (seller vs customer permissions)

## Client Expectations: Silicon Valley Engineering Standards

### Engineering Philosophy
The client seeks engineers who think beyond conventional solutions - similar to Google/Meta engineering teams who:
- Solve problems with innovative, sometimes unconventional approaches
- Build custom solutions when existing tools have limitations
- Optimize beyond documented performance limits
- Create ingenious workarounds for complex bottlenecks

### Technical Requirements
- **Modular Monolith**: Each module extractable to microservices instantly
- **Zero Unnecessary Files**: Every file must be justified
- **Instant Debugging**: Readable, traceable code at every level
- **Business Logic Flexibility**: Add/modify/remove features painlessly
- **Centralized Response System**: Consistent API responses across modules
- **Multi-Payment Provider**: Pluggable payment architecture
- **Environment Switching**: Instant dev/test/prod configuration changes

### Scalability Requirements
- Support 100-1K users → 1M-1B users seamlessly
- Handle 100 → 500K concurrent users
- Architecture must support this scale or project fails

### Development Standards
- **Architecture**: Choose optimal pattern (Clean Architecture/DDD/CQRS) for modular monolith
- **DevOps**: CI/CD on main branch, PM2 config, environment management
- **Documentation**: Swagger API docs, Laravel Telescope integration
- **Code Quality**: Shopify-engineer-level standards required
- **Testing**: Setup comprehensive testing framework
- **Security Toggle**: Instant E2E encryption enable/disable for API testing

## Job Contract: Acceptance Criteria

### CRITICAL SUCCESS FACTORS
**IF ANY OF THESE ARE NOT MET, CONTRACT WILL BE REJECTED:**

#### 1. Silicon Valley Engineering Standards
- Code must be reviewable by senior Shopify engineers who would say: *"This is fine, similar to what we do - we can work on this codebase"*
- Every single line and class will be scrutinized
- Must demonstrate Google/Meta-level engineering thinking

#### 2. Beyond Generic Development
**Client explicitly rejects "run-of-the-mill" developers who:**
- Follow only books, tutorials, documentation
- Work at typical small-medium service companies
- Use only conventional MNC approaches

**Client demands engineers who:**
- Can sit at the same table as Google engineers
- Build same quality products with same mindset and skillset
- Think beyond language/DSA/research paper constraints
- Create unconventional, hacky, patchy, god-mode, ingenious solutions
- Sometimes build solutions the programming language creators didn't envision
- Build wrappers to exceed Redis's expected performance limits
- Sometimes, e.g. might be needing to build CRDT stuff now there could be challenges laravel is good or it lacks libraries like JAVA or ASP.NET -> in that case we will need to go trhough adeaute research papers, possibly conferences from youtube and blogs and take the best decision on architechure and come up with a solution that fits budget as well as solve the issue efficient -> I MEAN THIS IS EVERYDAY OCCURANCE AT GOOGLE/SHOPIFY AND SILLICON VALLIES

- Let's assume we need to build a custom CRDT like feature now those devs as needed go through research papers and thankfully most of these available for free on internet so THOSE DEVS READS THOSE REASEARCH PAPERS (NOT CREATE THEIR OR WRITE THAT IS FOR SCIECNETS NOT FOR US )  AND IMPLEMENT TO THEIR LANAGUGE AS NEEDED WITH CUSTOMIZATIONS AND SUICH TO SOLVE THE CURRENT REQUIREMENT (VERY IMPORTANT) along with any uncommon and rare data strcuture and algorihtm as neeeded 

- SO, DON'T THINK THAT I AM IMPLYING THE CLIENT WANTS US TO CREATE RESEARCH PAPERS OR SUCH

- Taking an open source tool creating a wrapper that fits internal use case or building a tool with Redis + Lua that might or might not done or though before by other engineers  so yes we could say those engineers know how to beyond of current libary, language or whatnot they are using

- So, they know how to -> Build custom solutions that exceed framework limitations
- So they know how to -> Create ingenious workarounds for complex bottlenecks
- So they know how to -> Sometimes build wrappers around Redis/tools that push beyond documented limits
- So they know how to -> Research papers, conferences, and create solutions that didn't exist before
- So they know how to -> Build CRDT implementations when Laravel lacks what Java/.NET has

- SO THESE ARE JUST COMMON EVERYDAY THINGS FOR TOP TIPER ENGIEERS OF GOOGLE/SHOPIFYT AND SILLICONS VALLLIES 


- **THIS STANDARD IS NON-NEGOTIABLE FOR CONTRACT APPROVAL**

#### 3. Architecture Excellence
- **Modular Monolith**: Instant microservice extraction capability
- **Zero Bloat**: Every file must have justified purpose
- **Instant Scalability**: 100 users → 1B users seamless transition
- **Performance**: Handle 100 → 500K concurrent users
- **Maintainability**: Instant debugging, modification, extension
- **Business Logic**: Painless add/remove/replace functionality

#### 4. Technical Implementation Standards
- **Code Quality**: Shopify-engineer approval level
- **Structure**: No unnecessary files tolerated
- **Modularity**: Microservice-ready architecture
- **Security**: Instant E2E toggle for testing
- **DevOps**: CI/CD, PM2, environment management
- **Documentation**: Swagger, Laravel Telescope
- **Testing**: Comprehensive but not blocking setup

#### 5. Innovation Expectation
Must demonstrate ability to:
- Solve bottlenecks with custom solutions
- Optimize beyond documented limits
- Build ingenious workarounds
- Create solutions that surpass standard implementations
- Think like Silicon Valley engineers facing real production challenges

## Architecture Strategy

### Modular Monolith Design
```
src/
├── Modules/
│   ├── Auth/
│   ├── Product/
│   ├── Order/
│   ├── Payment/
│   └── Chat/
├── Shared/
│   ├── Services/
│   ├── Middleware/
│   └── Contracts/
└── Infrastructure/
```

### Microservices Extraction Path
1. Isolate module routes, services, models
2. Replace direct calls with API/queue interfaces
3. Deploy as independent service
4. Zero downtime migration

### Performance Targets
- **Database**: Redis caching, query optimization
- **Queues**: Background job processing
- **Monitoring**: Centralized logging and metrics
- **Horizontal Scaling**: Container-ready architecture

## FINAL WARNING
**This is not a typical development project. This requires Silicon Valley-level engineering excellence. Generic solutions will result in immediate contract rejection. Every aspect will be evaluated against Google/Shopify engineering standards.**