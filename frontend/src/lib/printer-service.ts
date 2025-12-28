export class PrinterService {
    private device: USBDevice | null = null;
    private interfaceNumber: number = 0;
    private endpointOut: number = 0;

    constructor() { }

    // Check if WebUSB is supported
    isSupported() {
        return 'usb' in navigator;
    }

    // Connect to a USB Printer (User gesture required)
    async connect() {
        try {
            // Filter for common thermal printer vendors (EPSON, basic generic ones)
            // Note: Filters are optional, omitting them shows all devices
            this.device = await navigator.usb.requestDevice({
                filters: []
            });

            await this.device.open();
            await this.device.selectConfiguration(1);

            // simple heuristic to find the interface/endpoint (typically 0 and usually endpoint 1 or 2 is OUT)
            // refined logic would iterate interfaces to find 'printer' class
            const iface = this.device.configuration?.interfaces[0];
            if (!iface) throw new Error("No interface found");

            this.interfaceNumber = iface.interfaceNumber;
            await this.device.claimInterface(this.interfaceNumber);

            // Find OUT endpoint
            const endpoint = iface.alternate.endpoints.find((e: USBEndpoint) => e.direction === 'out');
            if (!endpoint) throw new Error("No OUT endpoint found");

            this.endpointOut = endpoint.endpointNumber;

            console.log("Printer Connected!", this.device.productName);
            return true;
        } catch (error) {
            console.error("Printer Connection Failed:", error);
            return false;
        }
    }

    // Generate ESC/POS Commands
    // This is a simplified buffer builder
    async printReceipt(data: {
        storeName: string;
        items: { name: string; qty: number; price: number }[];
        total: number;
    }) {
        if (!this.device) {
            alert("Printer not connected! (Simulating Print)");
            console.log("RAW DATA:", data);
            return;
        }

        const encoder = new TextEncoder();
        const commands: number[] = [];

        const addBytes = (bytes: number[]) => commands.push(...bytes);
        const addText = (text: string) => {
            const encoded = encoder.encode(text);
            encoded.forEach(b => commands.push(b));
        };

        // Initialize Printer
        addBytes([0x1B, 0x40]);

        // Center Align & Bold Title
        addBytes([0x1B, 0x61, 0x01]); // Center
        addBytes([0x1B, 0x45, 0x01]); // Bold On
        addText(data.storeName + "\n");
        addBytes([0x1B, 0x45, 0x00]); // Bold Off
        addText("--------------------------------\n");

        // Left Align Content
        addBytes([0x1B, 0x61, 0x00]); // Left

        data.items.forEach(item => {
            addText(`${item.name} x${item.qty}\n`);
            // Right align price (simple space padding for demo)
            addText(`$${(item.price * item.qty).toFixed(2)}\n`);
        });

        addText("--------------------------------\n");

        // Total
        addBytes([0x1B, 0x45, 0x01]); // Bold
        addText(`TOTAL: $${data.total.toFixed(2)}\n`);
        addBytes([0x1B, 0x45, 0x00]); // Off

        // Feed & Cut
        addText("\n\n\n");
        addBytes([0x1D, 0x56, 0x41, 0x10]); // Cut

        // Send to Printer
        const buffer = new Uint8Array(commands);
        await this.device.transferOut(this.endpointOut, buffer);
    }
}

export const printerService = new PrinterService();
