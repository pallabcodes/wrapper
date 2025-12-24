export class Template {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly createdAt: Date = new Date(),
    ) { }
}
