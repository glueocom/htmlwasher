import { hello } from "./index";

describe("hello", () => {
	it("should greet by name", () => {
		expect(hello("World")).toBe("Hello, World!");
	});
});
