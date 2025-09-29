Here’s a clean **Markdown version** of our full Q&A so far:

---

# Software Architecture Q&A

---

## Q1: Characteristics of Microservices Architecture

**Answer:**
Microservices architecture is a way of designing software systems as a collection of small, independent services.

**Key Characteristics:**

1. **Independently Deployable Services** – Each service can be deployed without affecting others.
2. **Loose Coupling** – Services interact via well-defined APIs.
3. **High Cohesion, Single Responsibility** – Each service focuses on a specific business capability.
4. **Decentralized Data Management** – Each service often has its own database.
5. **Technology Diversity (Polyglot)** – Teams can choose different tech stacks per service.
6. **Scalability** – Services scale independently.
7. **Resilience & Fault Isolation** – Failures are contained within services.
8. **Automation & DevOps Integration** – CI/CD, containers, Kubernetes.
9. **API-First Communication** – Well-defined contracts between services.
10. **Organized Around Business Capabilities** – Aligned with business functions.
11. **Observability** – Monitoring, logging, distributed tracing.

✅ In short: Microservices are **small, loosely coupled, independently deployable, and business-focused services**.

---

## Q2: Characteristics of Serverless Architecture

**Answer:**
Serverless architecture abstracts away infrastructure, letting developers focus purely on code.

**Key Characteristics:**

1. **No Server Management** – Provider handles provisioning, scaling, security.
2. **Event-Driven & Stateless** – Functions triggered by events, no persistent state.
3. **Automatic Scaling** – Scales up/down per demand.
4. **Pay-as-You-Go** – Billed only for execution time and resources used.
5. **Short-Lived Execution** – Functions are lightweight and time-limited.
6. **Managed Infrastructure & High Availability** – Fault tolerance and redundancy built-in.
7. **Micro-billing & Granular Allocation** – Pay per millisecond, per request.
8. **Vendor Dependency** – Risk of provider lock-in.
9. **Security by Provider** – OS/runtime security handled by provider.
10. **Focus on Business Logic** – Developers focus on writing functional code.

✅ In summary: **Serverless is event-driven, stateless, auto-scaling, cost-efficient, with no server management required.**

---

## Q3: Characteristics of Event-Driven Architecture

**Answer:**
EDA organizes systems around **events** as the primary means of communication.

**Key Characteristics:**

1. **Event-Centric** – Everything revolves around state changes.
2. **Loose Coupling** – Producers and consumers are independent.
3. **Asynchronous Communication** – Events are transmitted asynchronously.
4. **Scalability** – Easy horizontal scaling with brokers/consumers.
5. **Real-Time Responsiveness** – Enables low-latency, real-time systems.
6. **Event Producers and Consumers** – Multiple subscribers can react to an event.
7. **Event Brokers / Middleware** – Kafka, RabbitMQ, AWS EventBridge, etc.
8. **Decoupled Data Flow** – No direct synchronous API dependency.
9. **Resilience & Fault Tolerance** – Events can be replayed if consumers fail.
10. **Complex Event Processing (CEP)** – Detects patterns, correlations, anomalies.

✅ In summary: EDA is **asynchronous, loosely coupled, scalable, resilient, and real-time**.

---

## Q4: Do I need to know any other architectures for my upcoming role at Google?

**Answer:**
Yes. Since you’re joining as an **SDE-3 / Principal Architect & Backend Engineer**, you should know several other core architectures beyond **Microservices, Serverless, and Event-Driven**.

### 🔑 Must-Know Architectures

1. **Monolithic Architecture** – Legacy and still widely used.
2. **Layered (N-tier) Architecture** – Classic enterprise style (presentation, business, data).
3. **Service-Oriented Architecture (SOA)** – Predecessor of microservices, still present in enterprises.
4. **Hexagonal / Ports & Adapters** – Separation of business logic and external systems.
5. **CQRS (Command Query Responsibility Segregation)** – Separation of reads/writes, often with Event Sourcing.
6. **Domain-Driven Design (DDD)** – Strategic design for large, complex systems.
7. **Data-Centric Architectures (Lambda / Kappa)** – For large-scale analytics and streaming.
8. **Distributed Systems Patterns** – CAP theorem, consensus algorithms (Paxos, Raft), leader election.
9. **Cloud-Native Architecture** – Kubernetes, service meshes, observability, resilience patterns.

✅ Apart from the 3 you know, focus on these for **system design, migrations, and scalability** at Google scale.