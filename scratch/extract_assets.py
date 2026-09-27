import os
from psd_tools import PSDImage

def extract_layer(psd, layer_name, output_path):
    def find_layer(layers, name):
        for layer in layers:
            if name.lower() in layer.name.lower():
                return layer
            if layer.is_group():
                found = find_layer(layer, name)
                if found: return found
        return None
    
    target = find_layer(psd, layer_name)
    if target:
        print(f"Found '{target.name}' in {psd}. Exporting to {output_path}...")
        image = target.composite()
        if image:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            image.save(output_path)
            print(f"Successfully saved {output_path}")
        else:
            print(f"Warning: Could not composite {target.name}")
    else:
        print(f"Warning: Layer containing '{layer_name}' not found.")

def main():
    out_dir = "public/images/ui"
    
    print("Extracting from Card mock-up.psb...")
    try:
        card_psb = PSDImage.open("design-source/Card mock-up.psb")
        extract_layer(card_psb, "frame", f"{out_dir}/card-frame.png")
        extract_layer(card_psb, "paper", f"{out_dir}/card-paper.png")
    except Exception as e:
        print(f"Error opening Card mock-up.psb: {e}")

    print("\nExtracting from drop-summary-template.psb...")
    try:
        drop_psb = PSDImage.open("design-source/drop-summary-template.psb")
        extract_layer(drop_psb, "FRAME", f"{out_dir}/drop-frame.png")
        extract_layer(drop_psb, "Icon_5_Stars", f"{out_dir}/stars-5.png")
        extract_layer(drop_psb, "Icon_4_Stars", f"{out_dir}/stars-4.png")
    except Exception as e:
        print(f"Error opening drop-summary-template.psb: {e}")

if __name__ == '__main__':
    main()
