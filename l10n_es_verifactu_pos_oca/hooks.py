# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo import fields


def post_init_hook(env):
    """Make every till reload the data this module adds to its loaders.

    The PoS keeps the loaded records in the browser's IndexedDB and only
    throws that copy away when pos.config.last_data_change is newer than it,
    a field that only its own configuration fields recompute. Installing or
    upgrading this module is therefore invisible to a till that is already
    running: it would keep serving a fiscal position without aeat_active and
    a company without verifactu_enabled, and the ticket QR would be decided
    on missing data.
    """
    env["pos.config"].search([]).last_data_change = fields.Datetime.now()
