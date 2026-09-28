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
        // Date fields reach the PoS as luxon DateTime, not as strings.
        const startDate = order.company.verifactu_start_date?.toFormat("yyyy-MM-dd");
        // The registration dates the document by the UTC date of date_order
        // (see the backend's _change_date_format / _get_document_date), so
        // the QR code follows it to keep both on the same day for orders
        // around midnight.
        const documentDate = order.date_order.toUTC();
        // The conditions mirror pos.order's _compute_verifactu_enabled, read
        // from records the PoS already holds rather than from the order's own
        // verifactu_enabled: that one is computed server-side, so an order
        // finalized offline -- the very case this getter exists for -- reaches
        // the receipt without it.
        const isEnabled =
            order.company.verifactu_enabled &&
            order.config.verifactu_journal_enabled &&
            order.is_l10n_es_simplified_invoice &&
            !order.to_invoice &&
            (!startDate || documentDate.toFormat("yyyy-MM-dd") >= startDate) &&
            (!order.fiscal_position_id || order.fiscal_position_id.aeat_active);
        if (!isEnabled) {
            return false;
        }
        const nif = (order.company.vat || "").replace(/^ES/i, "");
        const params = new URLSearchParams({
            nif: nif,
            numserie: (order.l10n_es_unique_id || "").substring(0, 60),
            fecha: documentDate.toFormat("dd-MM-yyyy"),
            // The backend's amount_total only lands on the order once the sync
            // answers, so offline it is undefined and reading it would take
            // the whole receipt down with it. priceIncl is computed locally.
            importe: order.priceIncl.toFixed(2),
        });
        const url = `${order.config.verifactu_base_url}?${params.toString()}`;
        return generateQRCodeDataUrl(url);
    },
});
