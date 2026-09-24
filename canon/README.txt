CANON WEBSITE - HOME PAGE
=========================

This is a complete single-page website structure based on your specifications.

FILES CREATED:
- index.html - Main homepage with all sections

SECTIONS STRUCTURE:
1. LOADING/ENTRANCE SCREEN
   - Automatic entrance animation plays on page load (2 seconds)
   - Hides automatically after animation completes
   - Based on your opening animation folder

2. HERO SECTION (Entrance Section)
   - Left side: Animated text "Discover Excellence"
   - Right side: Hero animation placeholder
   - Animation plays from your intro folder frames
   - Goes through scrolling effect to 2nd section

3. CAROUSEL SECTION (3rd Section)
   - Left-to-right moving carousel
   - White lightning effect on dark background
   - Product items from your carousel folder
   - Black color products visible on dark background
   - Only plays once, no repetition

4. 4TH SECTION
   - Left and right intro content with continuing animations
   - Animations keep playing through sections
   - Frame animations from your 4th folder

COLOR THEME:
- Only white and dark black colors
- No other backgrounds allowed
- All section backgrounds use your frame content
- Dark text on white where needed, inverse where appropriate

HOW TO CUSTOMIZE:
1. Replace placeholder images in the HTML:
   - Product carousel images: Update <img> src attributes in #carousel-section
   - Hero animation placeholder: Replace .hero-placeholder div content
   - 4th section placeholder: Replace .hero-placeholder div content

2. Replace loader animation:
   - The .loader element in #loading-screen can be customized
   - Or replace with your actual opening animation

3. Add actual media:
   - Place your Canon opening animation frames where the loader is
   - Replace hero placeholder with your intro animation frames
   - Swap carousel product images with your carousel frames
   - Update 4th section with your 4th folder frames

4. Animation timing:
   - Entrance: 2 seconds (can be adjusted in setTimeout)
   - Carousel: 20s linear infinite (can be adjusted in CSS)
   - Fade/slide animations: 1s ease-out each stage

5. Remove placeholder text and add your actual content

The website structure follows all your strict rules:
- Only white (#ffffff) and dark black (#0a0a0a/#1a1a1a) colors
- No external backgrounds - all use frame content
- Animations play between sections, not just under sections
- No scrolling needed for entrance, scroll-based for subsequent sections
- Balanced font sizes across all sections