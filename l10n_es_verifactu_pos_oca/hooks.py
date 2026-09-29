# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo import fields


def post_init_hook(env):
    """Make every till reload the data this module adds to its loaders.

    A running till keeps the loaded records in IndexedDB and only throws that
    copy away when pos.config.last_data_change is newer, a field that only the
    till's own configuration fields recompute.
    """
    env["pos.config"].search([]).last_data_change = fields.Datetime.now()
