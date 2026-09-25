/* Copyright 2025 Alia Technologies - César Parguiñas
   License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
*/

import {OrderReceipt} from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import {generateQRCodeDataUrl} from "@point_of_sale/utils";
import {patch} from "@web/core/utils/patch";

patch(OrderReceipt.prototype, {
    /**
     * Builds the VERI*FACTU QR code client-side, the same way the backend
     * does it for `verifactu_qr_url` (nif/numserie/fecha/importe). It has to
     * be generated here and not read from the `verifactu_qr` field computed
     * by the mixin: that field is only ever set when `state == "posted"`,
     * which a pos.order never reaches, and even if it did, an order
     * finalized offline needs the QR on the printed ticket before it ever
     * syncs back to the server.
     * @returns {String|Boolean} A data URL for the QR image, or false when
     *  the order isn't a VERI*FACTU simplified invoice.
     */
    get verifactuQr() {
        const order = this.order;
        const isEnabled =
            order.verifactu_enabled &&
            order.is_l10n_es_simplified_invoice &&
            (!order.fiscal_position || order.fiscal_position.aeat_active);
        if (!isEnabled) {
            return false;
        }
        const nif = (order.company.vat || "").replace(/^ES/i, "");
        const fecha = order.date_order.toFormat("dd-MM-yyyy");
        const params = new URLSearchParams({
            nif: nif,
            numserie: order.l10n_es_unique_id || "",
            fecha: fecha,
            importe: order.amount_total.toFixed(2),
        });
        const url = `${order.config.verifactu_base_url}?${params.toString()}`;
        return generateQRCodeDataUrl(url);
    },
});
