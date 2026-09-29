/* License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl). */

import * as Chrome from "@point_of_sale/../tests/pos/tours/utils/chrome_util";
import * as Dialog from "@point_of_sale/../tests/generic_helpers/dialog_util";
import * as OfflineUtil from "@point_of_sale/../tests/generic_helpers/offline_util";
import * as PaymentScreen from "@point_of_sale/../tests/pos/tours/utils/payment_screen_util";
import * as ProductScreen from "@point_of_sale/../tests/pos/tours/utils/product_screen_util";
import * as ReceiptScreen from "@point_of_sale/../tests/pos/tours/utils/receipt_screen_util";
import {registry} from "@web/core/registry";
import {run} from "@point_of_sale/../tests/generic_helpers/utils";

/**
 * The QR code is built in the browser precisely so that a sale charged with no
 * connection still prints it, so the only meaningful check is an offline one:
 * every value it reads has to be available without asking the server.
 */
registry.category("web_tour.tours").add("VerifactuPosOfflineTour", {
    steps: () =>
        [
            Chrome.startPoS(),
            Dialog.confirm("Open Register"),
            OfflineUtil.setOfflineMode(),
            ProductScreen.addOrderline("VeriFactu Tour Product", "1"),
            ProductScreen.clickPayButton(),
            PaymentScreen.clickPaymentMethod("Cash"),
            PaymentScreen.clickValidate(),
            ReceiptScreen.isShown(),
            {
                content: "The ticket carries the VERI*FACTU QR code",
                trigger: ".pos-receipt img.verifactu-qr[src^='data:image']",
            },
            run(() => {
                const order = odoo.__WOWL_DEBUG__.root.env.services.pos.getOrder();
                if (!order.l10n_es_unique_id) {
                    throw new Error("The order got no simplified invoice number");
                }
            }, "The offline sale is numbered as a simplified invoice"),
            // Deliberately left offline: going back online here starts a sync
            // the tour would end in the middle of.
        ].flat(),
});
