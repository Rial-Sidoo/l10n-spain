# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo.tests import HttpCase, tagged

from odoo.addons.l10n_es_verifactu_oca.tests.common import TestVerifactuCommon


@tagged("post_install", "-at_install")
class TestVerifactuPosOfflineTour(TestVerifactuCommon, HttpCase):
    """The ticket QR is built in the browser so that a till with no connection
    still prints it, so it has to be exercised with the browser offline: every
    value the receipt getter reads must already be in the PoS data, never on a
    field the server computes and sends back on sync.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # The tour logs in as admin, which the PoS controller refuses to serve
        # unless the till's company is among the ones that user is allowed.
        cls.tour_user = cls.env.ref("base.user_admin")
        cls.tour_user.company_ids |= cls.company
        cls.tour_user.company_id = cls.company
        sequence = cls.env["ir.sequence"].create(
            {
                "name": "POS Tour Simplified Invoice",
                "code": "pos.config.simplified_invoice",
                "prefix": "TOUR/",
                "padding": 4,
                "company_id": cls.company.id,
            }
        )
        sale_journal = cls.env["account.journal"].create(
            {
                "name": "PoS Tour Sale",
                "type": "sale",
                "code": "TOURS",
                "company_id": cls.company.id,
            }
        )
        cash_journal = cls.env["account.journal"].create(
            {
                "name": "PoS Tour Cash",
                "type": "cash",
                "code": "TOURC",
                "company_id": cls.company.id,
            }
        )
        receivable = cls.env["account.account"].create(
            {
                "code": "X1012.TOUR",
                "name": "Debtors - PoS tour",
                "reconcile": True,
                "account_type": "asset_receivable",
                "company_ids": [(6, 0, cls.company.ids)],
            }
        )
        cls.company.account_default_pos_receivable_account_id = receivable
        cls.tour_product = cls.env["product.product"].create(
            {
                "name": "VeriFactu Tour Product",
                "available_in_pos": True,
                "list_price": 10,
                "taxes_id": [(5, 0, 0)],
            }
        )
        cls.cash_payment_method = cls.env["pos.payment.method"].create(
            {
                "name": "Cash",
                "journal_id": cash_journal.id,
                "receivable_account_id": receivable.id,
                "company_id": cls.company.id,
            }
        )
        cls.pos_config = cls.env["pos.config"].create(
            {
                "name": "VeriFactu Tour POS",
                "company_id": cls.company.id,
                "journal_id": sale_journal.id,
                "iface_l10n_es_simplified_invoice": True,
                "l10n_es_simplified_invoice_limit": 3000,
                "l10n_es_simplified_invoice_sequence_id": sequence.id,
                "payment_method_ids": [(6, 0, cls.cash_payment_method.ids)],
            }
        )

    @staticmethod
    def _ignore_expected_connection_loss(message):
        """Whether a browser error must fail the tour.

        Reaching for the next simplified invoice number logs the lost
        connection on purpose (l10n_es_pos_oca falls back to incrementing it
        locally), and its message does not carry the class name the PoS
        offline helper filters on, so it has to be filtered here instead.
        """
        text = str(message)
        expected = (
            "ConnectionLostError",
            "Connection couldn't be established or was interrupted",
        )
        return not any(marker in text for marker in expected)

    def test_ticket_qr_survives_an_offline_sale(self):
        self.pos_config.with_user(self.tour_user).open_ui()
        self.start_tour(
            f"/pos/ui/{self.pos_config.id}",
            "VerifactuPosOfflineTour",
            login="admin",
            error_checker=self._ignore_expected_connection_loss,
        )
        self.assertFalse(
            self.env["pos.order"].search([("config_id", "=", self.pos_config.id)]),
            "Sanity: the sale was charged with no connection, so the server "
            "cannot have it yet -- the QR on that ticket was built entirely "
            "from what the till already held",
        )
