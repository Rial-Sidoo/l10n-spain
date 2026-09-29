/* Copyright 2025 Alia Technologies - César Parguiñas
   License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
*/

import {OrderReceipt} from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import {generateQRCodeDataUrl} from "@point_of_sale/utils";
import {patch} from "@web/core/utils/patch";

patch(OrderReceipt.prototype, {
    /**
     * Builds the VERI*FACTU QR code client-side, since the mixin's
     * verifactu_qr is only set on posted moves and the ticket has to print
     * offline.
     * @returns {String|Boolean} A data URL for the QR image, or false when
     *  the order isn't a VERI*FACTU simplified invoice.
     */
    get verifactuQr() {
        const order = this.order;
        // Date fields reach the PoS as luxon DateTime, not as strings.
        const startDate = order.company.verifactu_start_date?.toFormat("yyyy-MM-dd");
        // The registration dates the document by the UTC date of date_order.
        const documentDate = order.date_order.toUTC();
        // Mirrors _compute_verifactu_enabled from records the PoS holds, as
        // the order's own verifactu_enabled is computed server-side.
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
            // Amount_total only lands on the order once the sync answers, so
            // offline the locally computed priceIncl takes its place.
            importe: order.currency.round(order.priceIncl).toFixed(2),
        });
        const url = `${order.config.verifactu_base_url}?${params.toString()}`;
        return generateQRCodeDataUrl(url);
    },
});
