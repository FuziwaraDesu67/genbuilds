from psd_tools import PSDImage
import sys

def inspect_psd(file_path):
    print(f"\n=== Inspecting {file_path} ===")
    try:
        psd = PSDImage.open(file_path)
        print(f"Size: {psd.width}x{psd.height}")
        
        def print_layers(layers, indent=""):
            for layer in layers:
                info = f"{indent}- {layer.name} (Type: {layer.kind}, Visible: {layer.visible})"
                
                if layer.kind == 'type':
                    try:
                        text = layer.text
                        info += f" => Text: {repr(text.strip())}"
                    except Exception as e:
                        info += f" => Text: [Error extracting: {e}]"
                
                print(info)
                
                if layer.is_group():
                    print_layers(layer, indent + "  ")

        print_layers(psd)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == '__main__':
    inspect_psd('design-source/Card mock-up.psb')
    inspect_psd('design-source/drop-summary-template.psb')
    inspect_psd('design-source/drop-summary-template.psd')
