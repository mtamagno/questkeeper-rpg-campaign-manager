# Lightbox image lifecycle

Every selected image creates a new numbered load request. The previous bitmap
is removed immediately, a visual skeleton and polite status announce the new
selection, and only the matching request may reveal its pixels. Late events
from an older request are ignored.

Failures show a filename-safe path segment and a Retry action without removing
previous/next navigation. Captions appear only after their matching image has
loaded, preventing a new caption from describing old pixels. The shared
component gives the same behavior to campaign galleries and character
notebooks.
