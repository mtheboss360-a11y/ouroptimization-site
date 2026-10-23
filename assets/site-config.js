/* Site switches. Change a value here and redeploy; nothing else needs editing.
   attorneyReviewed: shows attorneyReviewedText in the compliance section on the home page. Keep it false
   until the partner agreement and the courtesy terms have actually been reviewed. While it is false the
   sentence is not in the page at all, so nothing can read it.
   googleMapsKey: a Google Maps Platform key with only the Maps Static API enabled, restricted to the site's
   addresses (ouroptimization.com/* and *.netlify.app/*). Empty: the home page map is our own OpenStreetMap
   render. Set: the map underneath is Google's, and the privacy policy shows googleMapText. */
window.OWC_CONFIG = {
  attorneyReviewed: false,
  attorneyReviewedText: 'The partner agreement and the courtesy terms have been reviewed by a healthcare attorney.',
  googleMapsKey: '',
  googleMapText: 'The map on our home page comes from Google Maps. To show it, your browser asks Google for the map image, so Google receives your IP address and basic browser details, under Google’s own privacy policy.'
};
