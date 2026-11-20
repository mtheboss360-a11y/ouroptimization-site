/* Site switches. An element with data-flag="name" stays hidden until that switch is true; with data-flag-text="key",
   its words come from that value, so nothing is in the page while the switch is off or the value is empty.

   hipaaConfirmed / hipaaText: a sentence about HIPAA for the healthcare pages and the FAQ. Leave the switch false and
   the text empty until the owner has confirmed it is true for every healthcare client: business associate agreements
   signed, a documented risk assessment, and safeguards for the sign-ups the portal holds. Then put the confirmed
   sentence in hipaaText and set hipaaConfirmed to true. This file is public, so no unconfirmed claim goes in it. */
window.OWC_CONFIG = {
  hipaaConfirmed: false,
  hipaaText: ''
};
