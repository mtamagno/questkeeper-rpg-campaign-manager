# Character reading position

QuestKeeper remembers where a player stopped inside an unlocked character
sheet or optional notebook. The matching accordion reopens on return, but its
protected content still requires the normal password whenever the current
unlock session does not allow access.

Only safe navigation metadata is stored on the device: campaign ID, character
ID, one allow-listed sheet anchor, an optional notebook slide number and a
timestamp. Passwords, unlock state, prose, image data, titles and private
profile fields are never written to reading memory.

The sheet updates its marker through its navigation controls and the nearest
visible allow-listed section. A notebook updates it whenever a page is turned.
Malformed records are ignored; out-of-range notebook positions are clamped to
the available pages.
