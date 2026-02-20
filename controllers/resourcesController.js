const Shipment = require("../models/shipment");
const html_to_pdf = require("html-pdf-node");
const { Parser } = require("json2csv");


// ===============================
// INVOICE PDF
// ===============================
exports.generateInvoicePDF = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #2c3e50; }
            .box { margin-bottom: 10px; }
            .section { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>NXT Ship - Invoice</h1>
          <div class="box"><b>Order ID:</b> ${shipment.orderId}</div>
          <div class="box"><b>Date:</b> ${shipment.createdAt.toDateString()}</div>
          
          <div class="section">
            <h3>Pickup Details</h3>
            <p>${shipment.pickup.name}</p>
            <p>${shipment.pickup.address}, ${shipment.pickup.city}</p>
          </div>

          <div class="section">
            <h3>Delivery Details</h3>
            <p>${shipment.delivery.customerName}</p>
            <p>${shipment.delivery.address}, ${shipment.delivery.city}</p>
          </div>

          <div class="section">
            <h3>Product</h3>
            <p>Name: ${shipment.product.productName}</p>
            <p>Quantity: ${shipment.product.quantity}</p>
            <p>Value: ₹${shipment.product.orderValue}</p>
          </div>

          <div class="section">
            <b>Status:</b> ${shipment.status}
          </div>
        </body>
      </html>
    `;

    const file = { content: html };
    const options = { format: "A4" };

    const pdfBuffer = await html_to_pdf.generatePdf(file, options);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${shipment.orderId}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===============================
// SHIPPING LABEL PDF
// ===============================
exports.generateShippingLabelPDF = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            .container { border: 2px solid #000; padding: 20px; }
            h2 { text-align:center; }
            .section { margin-top: 15px; }
            .big { font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>NXT Ship - Shipping Label</h2>
            <div class="big">Order ID: ${shipment.orderId}</div>
            <div>Waybill: ${shipment.waybill || "Not Generated"}</div>

            <div class="section">
              <strong>From:</strong><br/>
              ${shipment.pickup.name}<br/>
              ${shipment.pickup.address}, ${shipment.pickup.city}<br/>
              ${shipment.pickup.phone}
            </div>

            <div class="section">
              <strong>To:</strong><br/>
              ${shipment.delivery.customerName}<br/>
              ${shipment.delivery.address}, ${shipment.delivery.city}<br/>
              ${shipment.delivery.phone}
            </div>

            <div class="section">
              Weight: ${shipment.product.weight} kg<br/>
              Payment Mode: ${shipment.paymentMode}<br/>
              Status: ${shipment.status}
            </div>
          </div>
        </body>
      </html>
    `;

    const pdfBuffer = await html_to_pdf.generatePdf({ content: html }, { format: "A6" });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=label-${shipment.orderId}.pdf`,
    });

    res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===============================
// CSV EXPORT (Single Shipment)
// ===============================
exports.exportShipmentCSV = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const fields = [
      "orderId",
      "orderNumber",
      "paymentMode",
      "status",
      "createdAt"
    ];

    const parser = new Parser({ fields });

    const csv = parser.parse([shipment]);

    res.header("Content-Type", "text/csv");
    res.attachment(`shipment-${shipment.orderId}.csv`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};