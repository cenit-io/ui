import { describe, expect, it, vi, beforeEach } from "vitest";
import { of } from "rxjs";

const dataTypeMock = {
  config: vi.fn(() => of({ title: "Contact" })),
  getTitle: vi.fn(() => of("Contact")),
  _type: "Setup::CenitDataType",
};

const dataTypeServiceMock = {
  DataType: {
    getById: vi.fn(() => of(dataTypeMock)),
  },
  FILE_TYPE: "Setup::FileDataType",
};

const configServiceMock = {
  update: vi.fn(),
  state: vi.fn(() => ({ subjects: {} })),
  tenantIdChanges: vi.fn(() => of("tenant-1")),
};

vi.mock("./DataTypeService", () => dataTypeServiceMock);
vi.mock("./ConfigService", () => ({
  default: configServiceMock,
}));

describe("subjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propagates title updates through subject title stream", async () => {
    const { MenuSubject } = await import("./subject");
    const subject = MenuSubject.instance() as any;

    const titles: string[] = [];
    const subscription = subject.title().subscribe((event: any) => titles.push(event.title));

    subject.computeTitle();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(titles[titles.length - 1]).toBe("Quick Access");
    subscription.unsubscribe();
  }, 10000);
});
